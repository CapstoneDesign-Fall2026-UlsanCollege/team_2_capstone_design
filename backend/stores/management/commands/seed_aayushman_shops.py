from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import transaction

from catalog.models import Product, Variant
from stores.models import Store, StoreMembership

User = get_user_model()

OWNER_EMAIL = "aayushman1234511@gmail.com"


SHOPS = [
    {
        "slug": "kora-coffee-tea",
        "name": "Kora Coffee & Tea",
        "theme_preset": "editorial-warm",
        "category": "Specialty Coffee & Tea",
        "city": "Lalitpur",
        "province": "Bagmati",
        "tagline": "Single-origin Nepali coffee roasted in Patan and spring-flush teas from Kanyam ridges.",
        "story_headline": "Highland Coffee & Loose-Leaf Tea from Nepal's Hill Farms",
        "about_text": (
            "Kora Coffee & Tea begins at 1,550 meters on family-tended slopes across Gulmi, Nuwakot, and Ilam. "
            "Every Tuesday morning, our Patan roastery cups and roasts small parchment lots alongside spring-flush orthodox teas.\n\n"
            "By partnering directly with growers at fair farm-gate rates and sealing every order within 48 hours of roasting, "
            "we bring clean, traceable morning rituals straight to doorsteps across Kathmandu Valley and all seven provinces."
        ),
        "address": "Jhatapol Lane, Patan, Lalitpur",
        "contact_phone": "9841225501",
        "contact_email": "hello@koracoffee.com.np",
        "support_email": "support@koracoffee.com.np",
        "instagram_url": "https://instagram.com/koracoffeetea",
        "banner_url": "https://images.unsplash.com/photo-1558618666-c721241b294e?auto=format&fit=crop&w=1400&q=85",
        "inside_valley_shipping_minor": 10000,
        "outside_valley_shipping_minor": 18000,
        "free_shipping_threshold_minor": 250000,
        "products": [
            {
                "slug": "gulmi-highland-arabica",
                "name": "Gulmi Highland Arabica",
                "description": "Washed Bourbon micro-lot grown at 1,550m in Aapchaur, Gulmi. Notes of wildflower honey, crisp apple, and toasted walnut.",
                "image_url": "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=900&q=80",
                "attributes": {
                    "category": "Specialty Coffee",
                    "origin": "Aapchaur, Gulmi",
                    "elevation": "1,550m",
                    "process": "Washed",
                    "roast": "Medium Roast",
                },
                "variants": [
                    ("KR-GUL-250W", "250g Whole Bean", 75000, 250),
                    ("KR-GUL-250P", "250g Pour-Over Grind", 75000, 250),
                    ("KR-GUL-500W", "500g Value Bag", 140000, 500),
                ],
            },
            {
                "slug": "nuwakot-honey-typica",
                "name": "Nuwakot Honey-Process Typica",
                "description": "Shade-grown Red Catuai and Typica from Kakani hills finished with slow honey drying for velvety dark-cocoa sweetness.",
                "image_url": "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=900&q=80",
                "attributes": {
                    "category": "Specialty Coffee",
                    "origin": "Kakani, Nuwakot",
                    "elevation": "1,600m",
                    "process": "Honey Process",
                    "roast": "Medium-Dark Roast",
                },
                "variants": [
                    ("KR-NUW-250W", "250g Whole Bean", 82000, 250),
                    ("KR-NUW-250E", "250g Espresso Grind", 82000, 250),
                    ("KR-NUW-500W", "500g Roastery Bag", 155000, 500),
                ],
            },
            {
                "slug": "kanyam-first-flush-black-tea",
                "name": "Kanyam First-Flush Orthodox Tea",
                "description": "Hand-plucked spring bud harvest from misty tea gardens at 2,000m in Ilam, yielding golden tips and muscatel warmth.",
                "image_url": "https://images.unsplash.com/photo-1567922045116-2a00fae2ed03?auto=format&fit=crop&w=900&q=80",
                "attributes": {
                    "category": "Himalayan Teas",
                    "origin": "Kanyam, Ilam",
                    "elevation": "2,000m",
                    "flush": "First Spring Flush",
                },
                "variants": [
                    ("KR-KAN-100G", "100g Pouch", 48000, 100),
                    ("KR-KAN-250G", "250g Caddy Tin", 105000, 250),
                ],
            },
            {
                "slug": "dhankuta-jade-oolong",
                "name": "Dhankuta Jade Tip Oolong",
                "description": "Lightly oxidized mountain oolong rolled in small batches with sweet stone-fruit aroma and a clean, lingering finish.",
                "image_url": "https://images.unsplash.com/photo-1766232574096-4c4380105cc7?auto=format&fit=crop&w=900&q=80",
                "attributes": {
                    "category": "Himalayan Teas",
                    "origin": "Hile, Dhankuta",
                    "elevation": "1,850m",
                    "oxidation": "Light Amber",
                },
                "variants": [
                    ("KR-DHA-75G", "75g Loose Leaf", 55000, 75),
                    ("KR-DHA-150G", "150g Reserve Tin", 98000, 150),
                ],
            },
            {
                "slug": "solukhumbu-evening-chamomile",
                "name": "Solukhumbu Chamomile Tisane",
                "description": "Caffeine-free whole alpine chamomile blossoms sun-dried along eastern mountain terraces for calm evening steeping.",
                "image_url": "https://images.unsplash.com/photo-1514733670139-4d87a1941d55?auto=format&fit=crop&w=900&q=80",
                "attributes": {
                    "category": "Herbal Infusions",
                    "origin": "Solukhumbu",
                    "caffeine": "Zero Caffeine",
                },
                "variants": [
                    ("KR-CHA-60G", "60g Glass Jar", 39000, 60),
                    ("KR-CHA-120G", "120g Eco Refill", 72000, 120),
                ],
            },
            {
                "slug": "barista-pour-over-carafe",
                "name": "Barista Pour-Over Glass Carafe",
                "description": "Heat-resistant borosilicate dripper server engineered for clean morning pour-over extractions at home.",
                "image_url": "https://images.unsplash.com/photo-1681366576762-b7942515a8a4?auto=format&fit=crop&w=900&q=80",
                "attributes": {
                    "category": "Brewing Gear",
                    "origin": "Thamel Studio",
                    "capacity": "600ml Server",
                },
                "variants": [
                    ("KR-CAR-600", "600ml Carafe + 40 Filters", 185000, None),
                ],
            },
        ],
    },
    {
        "slug": "jadibuti-botanicals",
        "name": "Jadibuti Botanicals",
        "theme_preset": "pahadi-sage",
        "category": "Medicinal Herbs & Ayurveda",
        "city": "Pokhara",
        "province": "Gandaki",
        "tagline": "Wild-harvested Himalayan roots, Ayurvedic powders, and cold-pressed botanical oils.",
        "story_headline": "Pure Himalayan Medicinal Herbs & Apothecary Formulations",
        "about_text": (
            "Jadibuti Botanicals works alongside certified high-altitude foraging collectives from Mustang, Manang, and Kaski. "
            "Every root, leaf, and resin is shade-cured without synthetic fillers or bleaching agents.\n\n"
            "From heirloom high-curcumin turmeric to cold-infused rosemary scalp elixirs, our Pokhara apothecary bottles every small run to preserve full natural potency."
        ),
        "address": "Lakeside Hallanchowk, Pokhara",
        "contact_phone": "9856022410",
        "contact_email": "care@jadibutibotanicals.com.np",
        "support_email": "care@jadibutibotanicals.com.np",
        "instagram_url": "https://instagram.com/jadibutibotanicals",
        "banner_url": "https://images.unsplash.com/photo-1768729341078-9da4e0ea959e?auto=format&fit=crop&w=1400&q=85",
        "inside_valley_shipping_minor": 10000,
        "outside_valley_shipping_minor": 15000,
        "free_shipping_threshold_minor": 200000,
        "products": [
            {
                "slug": "mustang-wild-turmeric",
                "name": "Heirloom High-Curcumin Haldi",
                "description": "Stone-milled heirloom Lakadong-grade mountain turmeric root rich in golden curcumin for daily tonic milk and immunity.",
                "image_url": "https://images.unsplash.com/photo-1768729340164-7d83fe18384d?auto=format&fit=crop&w=900&q=80",
                "attributes": {
                    "category": "Roots & Powders",
                    "origin": "Sindhupalchok",
                    "curcumin": "6.4% Natural Curcumin",
                },
                "variants": [
                    ("JB-HAL-150G", "150g Amber Jar", 42000, 150),
                    ("JB-HAL-350G", "350g Family Pouch", 85000, 350),
                ],
            },
            {
                "slug": "himalayan-ashwagandha-root",
                "name": "Pure Ashwagandha Root Powder",
                "description": "Traditional winter-cherry root powder carefully dried and stone-ground for restorative daily balance and calm focus.",
                "image_url": "https://images.unsplash.com/photo-1615485500834-bc10199bc727?auto=format&fit=crop&w=900&q=80",
                "attributes": {
                    "category": "Adaptogens",
                    "origin": "Palpa Mid-Hills",
                    "grade": "100% Pure Root",
                },
                "variants": [
                    ("JB-ASH-100G", "100g Apothecary Jar", 54000, 100),
                    ("JB-ASH-250G", "250g Refill Pack", 118000, 250),
                ],
            },
            {
                "slug": "sindhupalchok-ginger-mulethi",
                "name": "Mountain Ginger & Mulethi Root",
                "description": "Sun-sliced spicy mountain ginger root paired with soothing licorice root for seasonal throat warmth and digestion.",
                "image_url": "https://images.unsplash.com/photo-1495461199391-8c39ab674295?auto=format&fit=crop&w=900&q=80",
                "attributes": {
                    "category": "Roots & Powders",
                    "origin": "Kaski & Mustang",
                    "preparation": "Shade Dried Sliced",
                },
                "variants": [
                    ("JB-GIN-120G", "120g Glass Jar", 36000, 120),
                    ("JB-GIN-250G", "250g Kraft Bag", 68000, 250),
                ],
            },
            {
                "slug": "apothecary-herbal-spice-trio",
                "name": "Tulsi, Nettle & Chamomile Trio",
                "description": "Curated apothecary cabinet trio combining sacred purple tulsi leaf, Himalayan nettle greens, and whole chamomile.",
                "image_url": "https://images.unsplash.com/photo-1545840716-c82e9eec6930?auto=format&fit=crop&w=900&q=80",
                "attributes": {
                    "category": "Dried Botanicals",
                    "origin": "Gandaki Hills",
                    "pack": "3 x 50g Glass Jars",
                },
                "variants": [
                    ("JB-TRIO-150", "3-Jar Discovery Set", 115000, 150),
                ],
            },
            {
                "slug": "rosemary-timur-elixir",
                "name": "Rosemary & Timur Botanical Oil",
                "description": "Slow solar-infused cold-pressed mustard and sesame carrier oil blended with crushed Nepali timur berry and rosemary.",
                "image_url": "https://images.unsplash.com/photo-1693567397897-61ea5c665078?auto=format&fit=crop&w=900&q=80",
                "attributes": {
                    "category": "Oils & Balms",
                    "origin": "Lakeside Pokhara",
                    "bottle": "UV Amber Dropper",
                },
                "variants": [
                    ("JB-OIL-50ML", "50ml Dropper", 65000, None),
                    ("JB-OIL-100ML", "100ml Apothecary Bottle", 112000, None),
                ],
            },
            {
                "slug": "spikenard-night-essence",
                "name": "Jatamansi Calm Massage Essence",
                "description": "Wild-harvested Himalayan jatamansi (spikenard) essential oil blend crafted to ground restless evenings and sore joints.",
                "image_url": "https://images.unsplash.com/photo-1538159902923-2aa72bbd3bcf?auto=format&fit=crop&w=900&q=80",
                "attributes": {
                    "category": "Oils & Balms",
                    "origin": "Dolpa & Mustang",
                    "extraction": "Steam Distilled",
                },
                "variants": [
                    ("JB-JAT-30ML", "30ml Essential Blend", 89000, None),
                    ("JB-JAT-60ML", "60ml Studio Bottle", 159000, None),
                ],
            },
        ],
    },
    {
        "slug": "chauk-streetwear",
        "name": "Chauk Streetwear",
        "theme_preset": "ktm-bold",
        "category": "Nepali Streetwear & Apparel",
        "city": "Kathmandu",
        "province": "Bagmati",
        "tagline": "280 GSM boxy tees, 420 GSM brutalist hoodies, and utility carryalls sewn in Lazimpat.",
        "story_headline": "Contemporary Architectural Streetwear Sewn in Kathmandu",
        "about_text": (
            "Born inside Kathmandu's courtyard alleys, Chauk Streetwear crafts structured everyday silhouettes cut in small numbered runs at our Lazimpat workshop.\n\n"
            "We weave custom-milled heavyweight combed cottons and heavy loop-back French terry built for Valley monsoons, midnight rides, and lasting wear without seasonal waste."
        ),
        "address": "Lazimpat Ward 2, Kathmandu",
        "contact_phone": "9808114422",
        "contact_email": "studio@chaukstreetwear.com.np",
        "support_email": "orders@chaukstreetwear.com.np",
        "instagram_url": "https://instagram.com/chaukstreetwear",
        "banner_url": "https://images.unsplash.com/photo-1579269896398-4deb6cbdc320?auto=format&fit=crop&w=1400&q=85",
        "inside_valley_shipping_minor": 10000,
        "outside_valley_shipping_minor": 20000,
        "free_shipping_threshold_minor": 300000,
        "products": [
            {
                "slug": "lazimpat-heavy-boxy-tee",
                "name": "Lazimpat Heavy Boxy Tee (280 GSM)",
                "description": "Drop-shoulder relaxed cut sewn from 280 GSM combed cotton with dense high-ribbed neckline and reinforced shoulder tape.",
                "image_url": "https://images.unsplash.com/photo-1593278641722-49b1047ede21?auto=format&fit=crop&w=900&q=80",
                "attributes": {
                    "category": "Tees & Tops",
                    "fabric": "280 GSM Combed Cotton",
                    "fit": "Boxy Drop-Shoulder",
                },
                "variants": [
                    ("CK-TEE-M", "Size M", 185000, 320),
                    ("CK-TEE-L", "Size L", 185000, 340),
                    ("CK-TEE-XL", "Size XL", 195000, 360),
                ],
            },
            {
                "slug": "durbar-black-fleece-hoodie",
                "name": "Durbar Heavyweight Hoodie (420 GSM)",
                "description": "Structured obsidian fleece pullover featuring a double-layer architectural hood, concealed welt pocket, and wide ribbed cuffs.",
                "image_url": "https://images.unsplash.com/photo-1652823780977-b22c0ed84c97?auto=format&fit=crop&w=900&q=80",
                "attributes": {
                    "category": "Hoodies & Outerwear",
                    "fabric": "420 GSM Loopback Terry",
                    "origin": "Lazimpat Workshop",
                },
                "variants": [
                    ("CK-HOOD-M", "Size M", 345000, 680),
                    ("CK-HOOD-L", "Size L", 345000, 720),
                    ("CK-HOOD-XL", "Size XL", 360000, 760),
                ],
            },
            {
                "slug": "patan-grey-studio-hoodie",
                "name": "Patan Concrete French Terry Hoodie",
                "description": "Washed mineral-grey studio hoodie pigment-dyed for a soft broken-in hand feel from day one.",
                "image_url": "https://images.unsplash.com/photo-1564557287817-3785e38ec1f5?auto=format&fit=crop&w=900&q=80",
                "attributes": {
                    "category": "Hoodies & Outerwear",
                    "fabric": "400 GSM Brushed Fleece",
                    "finish": "Mineral Pigment Wash",
                },
                "variants": [
                    ("CK-PAT-M", "Size M", 325000, 650),
                    ("CK-PAT-L", "Size L", 325000, 690),
                    ("CK-PAT-XL", "Size XL", 335000, 730),
                ],
            },
            {
                "slug": "basantapur-chalk-pullover",
                "name": "Basantapur Chalk Oversized Pullover",
                "description": "Undyed raw ecru heavyweight cotton hoodie with articulated raglan sleeves built for crisp valley mornings.",
                "image_url": "https://images.unsplash.com/photo-1615397587950-3cbb55f95b77?auto=format&fit=crop&w=900&q=80",
                "attributes": {
                    "category": "Hoodies & Outerwear",
                    "fabric": "390 GSM Organic Terry",
                    "fit": "Oversized Raglan",
                },
                "variants": [
                    ("CK-BAS-M", "Size M", 315000, 640),
                    ("CK-BAS-L", "Size L", 315000, 680),
                ],
            },
            {
                "slug": "thamel-layered-shell-jacket",
                "name": "Thamel Crisp Twill Overshirt Jacket",
                "description": "Clean boxy overshirt jacket in structured matte cotton twill designed to layer effortlessly over tees and knits.",
                "image_url": "https://images.unsplash.com/photo-1622445275992-e7efb32d2257?auto=format&fit=crop&w=900&q=80",
                "attributes": {
                    "category": "Hoodies & Outerwear",
                    "fabric": "320 GSM Cotton Twill",
                    "origin": "Kathmandu Studio",
                },
                "variants": [
                    ("CK-SHL-M", "Size M", 420000, 600),
                    ("CK-SHL-L", "Size L", 420000, 640),
                ],
            },
            {
                "slug": "baluwatar-canvas-tote-kit",
                "name": "14oz Heavy Canvas Tote & Cap Pack",
                "description": "Studio everyday carryall sewn from 14oz unbleached duck canvas paired with our 6-panel twill field cap.",
                "image_url": "https://images.unsplash.com/photo-1770017863938-237bd953a6e6?auto=format&fit=crop&w=900&q=80",
                "attributes": {
                    "category": "Accessories",
                    "material": "14oz Heavy Duck Canvas",
                    "origin": "Kathmandu",
                },
                "variants": [
                    ("CK-TOTE-OS", "Standard Set", 145000, 400),
                    ("CK-TOTE-BAG", "Tote Bag Only", 95000, 280),
                ],
            },
        ],
    },
    {
        "slug": "bhir-honey-harvest",
        "name": "Bhir Honey & Harvest",
        "theme_preset": "midnight-obsidian",
        "category": "Raw Honey & Mountain Pantry",
        "city": "Lalitpur",
        "province": "Bagmati",
        "tagline": "Unfiltered cliff honey, Jumla clarified ghee, Mustang walnuts, and local mountain spices.",
        "story_headline": "Raw Mountain Honey & Local Harvested Provisions from Rural Nepal",
        "about_text": (
            "Bhir Honey & Harvest curates unadulterated mountain foods straight from village apiaries in Lamjung and Rukum, pasture dairies in Jumla, and orchards in Mustang.\n\n"
            "Every jar of honey is cold-strained through coarse linen to retain live enzymes and alpine pollen, bottled cleanly in UV-safe glass at our Sanepa pantry studio."
        ),
        "address": "Sanepa Chowk, Lalitpur & Lamjung",
        "contact_phone": "9849330088",
        "contact_email": "harvest@bhirgoods.com.np",
        "support_email": "harvest@bhirgoods.com.np",
        "instagram_url": "https://instagram.com/bhirhoneyharvest",
        "banner_url": "https://images.unsplash.com/photo-1618515299844-7b810f9301df?auto=format&fit=crop&w=1400&q=85",
        "inside_valley_shipping_minor": 10000,
        "outside_valley_shipping_minor": 18000,
        "free_shipping_threshold_minor": 200000,
        "products": [
            {
                "slug": "lamjung-raw-wildflower-honey",
                "name": "Lamjung Raw Wildflower Honey",
                "description": "Cold-extracted raw spring wildflower honey harvested above 1,800m in Lamjung forests—bright, floral, and unheated.",
                "image_url": "https://images.unsplash.com/photo-1671548185843-3f50c6c1060b?auto=format&fit=crop&w=900&q=80",
                "attributes": {
                    "category": "Wild Honey",
                    "origin": "Lamjung Forests",
                    "extraction": "Cold Strained Raw",
                },
                "variants": [
                    ("BH-LAM-350G", "350g Glass Jar", 68000, 350),
                    ("BH-LAM-700G", "700g Reserve Jar", 125000, 700),
                ],
            },
            {
                "slug": "rukum-high-altitude-honey",
                "name": "Rukum Valley Amber Forest Honey",
                "description": "Deep caramelized buckwheat-and-cliff blossom honey poured with zero pasteurization for morning toast and spiced teas.",
                "image_url": "https://images.unsplash.com/photo-1545247175-2ef9d102d51c?auto=format&fit=crop&w=900&q=80",
                "attributes": {
                    "category": "Wild Honey",
                    "origin": "Rukum Valley",
                    "harvest": "Autumn Single-Batch",
                },
                "variants": [
                    ("BH-RUK-500G", "500g Jar + Dipper", 95000, 500),
                    ("BH-RUK-1KG", "1kg Family Jar", 178000, 1000),
                ],
            },
            {
                "slug": "jumla-pasture-cow-ghee",
                "name": "Jumla Pasture Clarified Ghee",
                "description": "Traditional cultured bilona cow ghee slow-simmered over wood fire from high-mountain grazing herds in Karnali.",
                "image_url": "https://images.unsplash.com/photo-1760383710574-73f43fd3370d?auto=format&fit=crop&w=900&q=80",
                "attributes": {
                    "category": "Mountain Pantry",
                    "origin": "Jumla, Karnali",
                    "method": "Cultured Bilona Churn",
                },
                "variants": [
                    ("BH-GHE-500ML", "500ml Glass Jar", 115000, 500),
                    ("BH-GHE-1L", "1L Pantry Jar", 215000, 1000),
                ],
            },
            {
                "slug": "mustang-thin-shell-walnuts",
                "name": "Mustang Organic Thin-Shell Walnuts",
                "description": "Sun-cured mountain walnuts from Jomsom and Kagbeni orchards—plump, sweet kernels rich in natural oils.",
                "image_url": "https://images.unsplash.com/photo-1524593656068-fbac72624bb0?auto=format&fit=crop&w=900&q=80",
                "attributes": {
                    "category": "Nuts & Grains",
                    "origin": "Lower Mustang",
                    "harvest": "October Crop",
                },
                "variants": [
                    ("BH-WAL-500G", "500g Whole In-Shell", 78000, 500),
                    ("BH-WAL-1KG", "1kg Orchard Bag", 145000, 1000),
                ],
            },
            {
                "slug": "ilam-cinnamon-citrus-spices",
                "name": "Ilam Cinnamon Bark & Dried Citrus",
                "description": "Aromatic wild mountain Tejpat cinnamon quills dried with sun-cured valley citrus slices for mulled chai and slow cooking.",
                "image_url": "https://images.unsplash.com/photo-1554675427-1d637bdb5a12?auto=format&fit=crop&w=900&q=80",
                "attributes": {
                    "category": "Whole Spices",
                    "origin": "Eastern Hills",
                    "curing": "Sun Dried Whole",
                },
                "variants": [
                    ("BH-SPI-150G", "150g Jar", 45000, 150),
                    ("BH-SPI-300G", "300g Kitchen Tin", 84000, 300),
                ],
            },
            {
                "slug": "chitwan-wild-honey-pairing",
                "name": "Chiuri Butter & Wild Honey Pairing",
                "description": "Golden wildflower Chiuri blossom honey paired with delicate highland blossoms—bright, silky, and naturally crystallizing.",
                "image_url": "https://images.unsplash.com/photo-1644057703169-755be849071c?auto=format&fit=crop&w=900&q=80",
                "attributes": {
                    "category": "Wild Honey",
                    "origin": "Chitwan Foothills",
                    "nectar": "Chiuri Blossom",
                },
                "variants": [
                    ("BH-CHI-400G", "400g Jar", 62000, 400),
                    ("BH-CHI-800G", "800g Double Jar", 114000, 800),
                ],
            },
        ],
    },
]


class Command(BaseCommand):
    help = "Create and seed 4 complete flagship stores owned by aayushman1234511@gmail.com."

    def handle(self, *args, **options):
        with transaction.atomic():
            owner, created = User.objects.get_or_create(
                email=OWNER_EMAIL,
                defaults={
                    "full_name": "Aayushman",
                    "phone": "9841225501",
                },
            )
            if created:
                self.stdout.write(f"Created owner user: {owner.email}")
            else:
                self.stdout.write(f"Using existing owner user: {owner.email} (id={owner.id})")

            for shop_cfg in SHOPS:
                store, _ = Store.objects.update_or_create(
                    slug=shop_cfg["slug"],
                    defaults={
                        "name": shop_cfg["name"],
                        "theme_preset": shop_cfg["theme_preset"],
                        "category": shop_cfg["category"],
                        "city": shop_cfg["city"],
                        "province": shop_cfg["province"],
                        "currency": "NPR",
                        "tagline": shop_cfg["tagline"],
                        "story_headline": shop_cfg["story_headline"],
                        "about_text": shop_cfg["about_text"],
                        "address": shop_cfg["address"],
                        "contact_phone": shop_cfg["contact_phone"],
                        "contact_email": shop_cfg["contact_email"],
                        "support_email": shop_cfg["support_email"],
                        "instagram_url": shop_cfg["instagram_url"],
                        "banner_url": shop_cfg["banner_url"],
                        "inside_valley_shipping_minor": shop_cfg["inside_valley_shipping_minor"],
                        "outside_valley_shipping_minor": shop_cfg["outside_valley_shipping_minor"],
                        "free_shipping_threshold_minor": shop_cfg["free_shipping_threshold_minor"],
                        "shipping_configured": True,
                        "cod_enabled": True,
                        "is_active": True,
                    },
                )

                StoreMembership.objects.update_or_create(
                    store=store,
                    user=owner,
                    defaults={"role": "OWNER"},
                )

                for p_idx, p_cfg in enumerate(shop_cfg["products"], start=1):
                    product, _ = Product.objects.update_or_create(
                        store=store,
                        slug=p_cfg["slug"],
                        defaults={
                            "name": p_cfg["name"],
                            "description": p_cfg["description"],
                            "image_url": p_cfg["image_url"],
                            "attributes": p_cfg["attributes"],
                            "allow_one_time": True,
                            "is_active": True,
                            "is_starter_default": False,
                            "sort_order": p_idx,
                        },
                    )

                    for v_idx, (sku, label, price_minor, weight_g) in enumerate(p_cfg["variants"], start=1):
                        Variant.objects.update_or_create(
                            store=store,
                            sku=sku,
                            defaults={
                                "product": product,
                                "label": label,
                                "weight_grams": weight_g,
                                "price_minor": price_minor,
                                "allow_one_time": True,
                                "in_stock": True,
                                "track_inventory": False,
                                "is_active": True,
                                "sort_order": v_idx,
                            },
                        )

                self.stdout.write(
                    self.style.SUCCESS(
                        f"Seeded {store.name} (/s/{store.slug}, {store.theme_preset}) with {len(shop_cfg['products'])} products."
                    )
                )
