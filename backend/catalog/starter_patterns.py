"""
Conservative pattern matching for identifying untouched starter products created
by legacy store onboarding or `seed_starter_catalog`.

A product is considered an untouched starter default ONLY when its slug, name,
AND seed/placeholder image URL all match a known starter template for its store.
"""

STARTER_SEED_TRIPLES: tuple[tuple[str, str, str], ...] = (
    # Honey / herbs / sage
    ("wild-cliff-honey", "Raw Himalayan Wild Cliff Honey", "/images/products/himalayan-honey.svg"),
    ("white-forest-honey", "High-Altitude White Forest Honey", "/images/products/himalayan-honey.svg"),
    ("ginger-tulsi-honey", "Himalayan Ginger & Tulsi Honey Infusion", "/images/products/himalayan-honey.svg"),
    # Coffee / tea / roast
    ("nuwakot-arabica", "Single-Origin Nuwakot Arabica Whole Bean", "/images/products/nuwakot-heritage.svg"),
    ("ilam-first-flush", "Ilam First Flush Orthodox Black Tea", "/images/products/ilam-gold.svg"),
    ("everest-espresso", "Everest Mountain Dark Roast Espresso", "/images/products/gulmi-reserve.svg"),
    # Streetwear / fashion / apparel / obsidian
    ("heavyweight-tee", "Heavyweight Boxy Drop-Shoulder Tee", "/images/products/placeholder.svg"),
    ("hemp-utility-tote", "Raw Himalayan Hemp Utility Tote", "/images/products/placeholder.svg"),
    ("fisherman-beanie", "Ribbed Mountain Wool Fisherman Beanie", "/images/products/placeholder.svg"),
    # Crafts / handloom / pashmina
    ("tibetan-singing-bowl", "Hand-Hammered 7-Metal Tibetan Singing Bowl", "/images/products/placeholder.svg"),
    ("dhaka-pashmina-stole", "Pure Dhaka Handwoven Pashmina Stole", "/images/products/placeholder.svg"),
    ("ceramic-matcha-tumbler", "Artisanal Studio Ceramic Matcha Tumbler", "/images/products/placeholder.svg"),
    # Bakery / sweets / pastry
    ("sourdough-country-loaf", "Heritage Sourdough Country Loaf", "/images/products/placeholder.svg"),
    ("almond-croissants", "French Butter Almond Croissant (Box of 4)", "/images/products/placeholder.svg"),
    ("chocolate-sea-salt-brownies", "Artisan Dark Chocolate Sea-Salt Brownies", "/images/products/placeholder.svg"),
)

ARTISANAL_RESERVE_IMAGE = (
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80"
)


def is_untouched_starter_product(
    store_slug: str,
    store_name: str,
    product_slug: str,
    product_name: str,
    image_url: str,
) -> bool:
    """
    Returns True iff slug, name, and seed/placeholder image URL all match one
    of the known auto-seeded starter product templates for this store.
    """
    s_slug = (store_slug or "").strip()
    s_name = (store_name or "").strip()
    p_slug = (product_slug or "").strip()
    p_name = (product_name or "").strip()
    p_image = (image_url or "").strip()

    if not s_slug or not p_slug or not p_name:
        return False

    # Legacy single-item and fallback Signature Offering templates
    if (
        p_slug in ("starter-offering", f"{s_slug}-starter-offering", f"{s_slug}-signature-offering")
        and p_name == f"{s_name} Signature Offering"
        and p_image in ("/images/products/placeholder.svg", "")
    ):
        return True

    # Fallback secondary item
    if (
        p_slug == f"{s_slug}-artisanal-reserve"
        and p_name == f"{s_name} Artisanal Reserve"
        and p_image == ARTISANAL_RESERVE_IMAGE
    ):
        return True

    for slug_suffix, expected_name, expected_image in STARTER_SEED_TRIPLES:
        if p_slug == f"{s_slug}-{slug_suffix}" and p_name == expected_name and p_image == expected_image:
            return True

    return False
