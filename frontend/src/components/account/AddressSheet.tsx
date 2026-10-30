"use client";

import React, { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  createDeliveryAddress,
  updateDeliveryAddress,
  DeliveryAddressItem,
  DeliveryAddressPayload,
  ApiError,
} from "@/lib/api";
import { cn } from "@/lib/utils";

const NEPAL_ADMIN_DATA: Record<string, Record<string, string[]>> = {
  Bagmati: {
    Kathmandu: [
      "Kathmandu Metropolitan City",
      "Kirtipur Municipality",
      "Budhanilkantha Municipality",
      "Chandragiri Municipality",
      "Tokha Municipality",
      "Tarakeshwar Municipality",
      "Gokarneshwar Municipality",
      "Nagarjun Municipality",
      "Dakshinkali Municipality",
      "Shankharapur Municipality",
    ],
    Lalitpur: [
      "Lalitpur Metropolitan City",
      "Mahalaxmi Municipality",
      "Godawari Municipality",
      "Konjyosom Rural Municipality",
      "Bagmati Rural Municipality",
      "Mahankal Rural Municipality",
    ],
    Bhaktapur: [
      "Bhaktapur Municipality",
      "Madhyapur Thimi Municipality",
      "Suryabinayak Municipality",
      "Changunarayan Municipality",
    ],
    Chitwan: [
      "Bharatpur Metropolitan City",
      "Ratnanagar Municipality",
      "Khairahani Municipality",
      "Rapti Municipality",
      "Kalika Municipality",
      "Madi Municipality",
      "Ichhyakamana Rural Municipality",
    ],
    Kavrepalanchok: [
      "Dhulikhel Municipality",
      "Banepa Municipality",
      "Panauti Municipality",
      "Panchkhal Municipality",
      "Namobuddha Municipality",
      "Mandandeupur Municipality",
    ],
    Makwanpur: ["Hetauda Sub-Metropolitan City", "Thaha Municipality"],
    Dhading: ["Nilkantha Municipality", "Dhunibesi Municipality"],
    Nuwakot: ["Bidur Municipality", "Belkotgadhi Municipality"],
    Sindhupalchok: ["Chautara Sangachokgadhi Municipality", "Melamchi Municipality"],
    Sindhuli: ["Kamalamai Municipality", "Dudhauli Municipality"],
    Ramechhap: ["Manthali Municipality", "Ramechhap Municipality"],
    Dolkha: ["Bhimeshwar Municipality", "Jiri Municipality"],
    Rasuwa: ["Uttargaya Rural Municipality", "Kalika Rural Municipality", "Gosaikunda Rural Municipality"],
  },
  Gandaki: {
    Kaski: [
      "Pokhara Metropolitan City",
      "Annapurna Rural Municipality",
      "Machhapuchhre Rural Municipality",
      "Madi Rural Municipality",
      "Rupa Rural Municipality",
    ],
    Tanahun: ["Byas Municipality", "Shuklagandaki Municipality", "Bhanu Municipality", "Bhimad Municipality"],
    Gorkha: ["Gorkha Municipality", "Palungtar Municipality"],
    Lamjung: ["Besishahar Municipality", "Sundarbazar Municipality", "Rainas Municipality", "Madhya Nepal Municipality"],
    Syangja: ["Putalibazar Municipality", "Waling Municipality", "Chapakot Municipality", "Galyang Municipality", "Bhirkot Municipality"],
    Nawalpur: ["Kawasoti Municipality", "Gaindakot Municipality", "Devchuli Municipality", "Madhyabindu Municipality"],
    Parbat: ["Kushma Municipality", "Phalebas Municipality"],
    Baglung: ["Baglung Municipality", "Galkot Municipality", "Jaimuni Municipality", "Dhorpatan Municipality"],
    Myagdi: ["Beni Municipality"],
    Mustang: ["Gharpajhong Rural Municipality"],
    Manang: ["Chame Rural Municipality"],
  },
  Koshi: {
    Morang: ["Biratnagar Metropolitan City", "Sundarharaicha Municipality", "Belbari Municipality", "Pathari Shanischare Municipality"],
    Sunsari: ["Dharan Sub-Metropolitan City", "Itahari Sub-Metropolitan City", "Inaruwa Municipality", "Barahachhetra Municipality"],
    Jhapa: ["Birtamod Municipality", "Damak Municipality", "Mechinagar Municipality", "Bhadrapur Municipality", "Arjundhara Municipality"],
    Ilam: ["Ilam Municipality", "Deumai Municipality", "Mai Municipality", "Suryodaya Municipality"],
    Dhankuta: ["Dhankuta Municipality", "Pakhribas Municipality", "Mahalaxmi Municipality"],
    Udayapur: ["Triyuga Municipality", "Katari Municipality", "Chaudandigadhi Municipality", "Belaka Municipality"],
    Bhojpur: ["Bhojpur Municipality", "Shadanand Municipality"],
    Sankhuwasabha: ["Khandbari Municipality", "Chainpur Municipality", "Dharmadevi Municipality", "Madi Municipality"],
    Terhathum: ["Myanglung Municipality", "Laligurans Municipality"],
    Panchthar: ["Phidim Municipality"],
    Taplejung: ["Phungling Municipality"],
    Solukhumbu: ["Solududhkunda Municipality"],
    Khotang: ["Diktel Rupakot Majhuwagadhi Municipality", "Halesi Tuwachung Municipality"],
    Okhaldhunga: ["Siddhicharan Municipality"],
  },
  Madhesh: {
    Parsa: ["Birgunj Metropolitan City", "Pokhariya Municipality", "Bahudaramai Municipality", "Parsagadhi Municipality"],
    Dhanusha: ["Janakpur Sub-Metropolitan City", "Mithila Municipality", "Sabaila Municipality", "Dhanusadham Municipality"],
    Bara: ["Kalaiya Sub-Metropolitan City", "Jeetpursimara Sub-Metropolitan City", "Kolhabi Municipality", "Nijgadh Municipality"],
    Rautahat: ["Gaur Municipality", "Garuda Municipality", "Chandrapur Municipality"],
    Sarlahi: ["Malangwa Municipality", "Harion Municipality", "Barahathwa Municipality", "Lalbandi Municipality"],
    Mahottari: ["Jaleshwar Municipality", "Bardibas Municipality", "Gaushala Municipality"],
    Siraha: ["Siraha Municipality", "Lahan Municipality", "Golbazar Municipality", "Mirchaiya Municipality"],
    Saptari: ["Rajbiraj Municipality", "Kanchanrup Municipality", "Dakneshwari Municipality", "Bodebarsain Municipality"],
  },
  Lumbini: {
    Rupandehi: ["Butwal Sub-Metropolitan City", "Siddharthanagar Municipality", "Tilottama Municipality", "Sainamaina Municipality", "Devdaha Municipality", "Lumbini Sanskritik Municipality"],
    Banke: ["Nepalgunj Sub-Metropolitan City", "Kohalpur Municipality"],
    Dang: ["Ghorahi Sub-Metropolitan City", "Tulsipur Sub-Metropolitan City", "Lamahi Municipality"],
    Kapilvastu: ["Kapilvastu Municipality", "Banganga Municipality", "Buddhabhumi Municipality", "Shivaraj Municipality", "Krishnanagar Municipality"],
    Palpa: ["Tansen Municipality", "Rampur Municipality"],
    Arghakhanchi: ["Sandhikharka Municipality", "Sitaganga Municipality", "Bhumikasthan Municipality"],
    Gulmi: ["Tamghas (Resunga Municipality)", "Musikot Municipality"],
    Bardiya: ["Gulariya Municipality", "Rajapur Municipality", "Madhuwan Municipality", "Thakurbaba Municipality", "Bansgadhi Municipality", "Barbardiya Municipality"],
    Pyuthan: ["Pyuthan Municipality", "Swargadwari Municipality"],
    Rolpa: ["Rolpa Municipality"],
    Parasi: ["Ramgram Municipality", "Sunwal Municipality", "Bardaghat Municipality"],
    "Eastern Rukum": ["Rukumkot Rural Municipality"],
  },
  Karnali: {
    Surkhet: ["Birendranagar Municipality", "Bheriganga Municipality", "Gurbhakot Municipality", "Panchapuri Municipality", "Lekbeshi Municipality"],
    Dailekh: ["Narayan Municipality", "Dullu Municipality", "Chamunda Bindrasaini Municipality", "Aathbis Municipality"],
    Jumla: ["Chandannath Municipality"],
    Salyan: ["Sharada Municipality", "Bagchaur Municipality", "Bangad Kupinde Municipality"],
    Jajarkot: ["Bheri Municipality", "Chhedagad Municipality", "Nalgad Municipality"],
    "Western Rukum": ["Musikot Municipality", "Chaurjahari Municipality", "Aathbiskot Municipality"],
    Kalikot: ["Khandachakra Municipality", "Raskot Municipality", "Tilagufa Municipality"],
    Mugu: ["Chhayanath Rara Municipality"],
    Humla: ["Simkot Rural Municipality"],
    Dolpa: ["Thuli Bheri Municipality", "Tripurasundari Municipality"],
  },
  Sudurpashchim: {
    Kailali: ["Dhangadhi Sub-Metropolitan City", "Tikapur Municipality", "Godawari Municipality", "Lamki Chuha Municipality", "Ghodaghodi Municipality", "Bhajani Municipality", "Gauriganga Municipality"],
    Kanchanpur: ["Bhimdatta Municipality", "Bedkot Municipality", "Shuklaphanta Municipality", "Mahakali Municipality", "Krishnapur Municipality", "Punarbas Municipality", "Belauri Municipality"],
    Dadeldhura: ["Amargadhi Municipality", "Parashuram Municipality"],
    Doti: ["Dipayal Silgadhi Municipality", "Shikhar Municipality"],
    Achham: ["Mangalsen Municipality", "Sanfebagar Municipality", "Kamalbazar Municipality", "Panchadewal Binayak Municipality"],
    Baitadi: ["Dasharathchand Municipality", "Patan Municipality", "Melauli Municipality", "Purchaudi Municipality"],
    Bajhang: ["Jayaprithvi Municipality", "Bungal Municipality"],
    Bajura: ["Badimalika Municipality", "Tribeni Municipality", "Budhiganga Municipality", "Budhinanda Municipality"],
    Darchula: ["Khalanga (Mahakali Municipality)", "Shailyashikhar Municipality"],
  },
};

const PHONE_REGEX = /^9[78]\d{8}$/;

interface AddressFormProps {
  initialAddress?: DeliveryAddressItem | null;
  onSaved: (address: DeliveryAddressItem) => void;
  onClose: () => void;
}

function AddressForm({ initialAddress, onSaved, onClose }: AddressFormProps) {
  const isEditing = Boolean(initialAddress);

  const [label, setLabel] = useState(initialAddress?.label || "Home");
  const [recipientName, setRecipientName] = useState(initialAddress?.recipient_name || "");
  const [phone, setPhone] = useState(initialAddress?.phone || "");
  const [province, setProvince] = useState(initialAddress?.province || "Bagmati");
  const [district, setDistrict] = useState(initialAddress?.district || "Kathmandu");
  const [municipality, setMunicipality] = useState(
    initialAddress?.municipality || "Kathmandu Metropolitan City"
  );
  const [ward, setWard] = useState(initialAddress?.ward || 1);
  const [streetLandmark, setStreetLandmark] = useState(initialAddress?.street_landmark || "");
  const [isDefault, setIsDefault] = useState(initialAddress?.is_default || false);

  const [saving, setSaving] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const availableDistricts = Object.keys(NEPAL_ADMIN_DATA[province] || {});
  const availableMunicipalities =
    NEPAL_ADMIN_DATA[province]?.[district] || [`${district} Municipality`];

  const handleProvinceChange = (newProvince: string) => {
    setProvince(newProvince);
    const districts = Object.keys(NEPAL_ADMIN_DATA[newProvince] || {});
    const firstDistrict = districts[0] || "";
    setDistrict(firstDistrict);
    const munis = NEPAL_ADMIN_DATA[newProvince]?.[firstDistrict] || [];
    setMunicipality(munis[0] || `${firstDistrict} Municipality`);
  };

  const handleDistrictChange = (newDistrict: string) => {
    setDistrict(newDistrict);
    const munis = NEPAL_ADMIN_DATA[province]?.[newDistrict] || [];
    setMunicipality(munis[0] || `${newDistrict} Municipality`);
  };

  const handlePhoneBlur = () => {
    const cleanPhone = phone.trim().replace(/^\+977\s*/, "");
    if (cleanPhone && !PHONE_REGEX.test(cleanPhone)) {
      setPhoneError("Enter a 10-digit number starting with 98 or 97.");
    } else {
      setPhoneError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);

    const cleanPhone = phone.trim().replace(/^\+977\s*/, "");
    if (!cleanPhone || !PHONE_REGEX.test(cleanPhone)) {
      setPhoneError("Enter a 10-digit number starting with 98 or 97.");
      return;
    }

    if (!recipientName.trim()) {
      setGeneralError("Please enter recipient name.");
      return;
    }

    if (!streetLandmark.trim()) {
      setGeneralError("Please enter chowk, tole, or nearby landmark.");
      return;
    }

    setSaving(true);
    const payload: DeliveryAddressPayload = {
      label: label.trim() || "Home",
      recipient_name: recipientName.trim(),
      phone: cleanPhone,
      province,
      district,
      municipality,
      ward: Number(ward) || 1,
      street_landmark: streetLandmark.trim(),
      is_default: isDefault,
    };

    try {
      let saved: DeliveryAddressItem;
      if (isEditing && initialAddress) {
        saved = await updateDeliveryAddress(initialAddress.id, payload);
      } else {
        saved = await createDeliveryAddress(payload);
      }
      onSaved(saved);
      onClose();
    } catch (err: unknown) {
      if (err instanceof ApiError && err.fieldErrors) {
        const firstErrKey = Object.keys(err.fieldErrors)[0];
        if (firstErrKey) {
          setGeneralError(`${firstErrKey}: ${err.fieldErrors[firstErrKey][0]}`);
          return;
        }
      }
      const msg = err instanceof Error ? err.message : "Unable to save address. Please try again.";
      setGeneralError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between border-b border-[var(--sc-line,#E8E8E1)] pb-4 mb-4">
        <div>
          <Dialog.Title className="text-lg font-bold tracking-tight">
            {isEditing ? "Edit delivery address" : "Add delivery address"}
          </Dialog.Title>
          <Dialog.Description className="text-xs text-[var(--sc-ink-2,#4B5060)]">
            Nepali administrative address for accurate courier delivery.
          </Dialog.Description>
        </div>
        <Dialog.Close
          aria-label="Close dialog"
          className="rounded-md p-1.5 text-[var(--sc-ink-3,#8B90A0)] hover:text-[var(--sc-ink,#111318)] hover:bg-[var(--sc-paper,#FAFAF7)] transition-colors"
        >
          ✕
        </Dialog.Close>
      </div>

      {generalError && (
        <div className="mb-4 p-3 rounded-lg bg-[var(--sc-danger,#B42318)]/10 border border-[var(--sc-danger,#B42318)] text-[var(--sc-danger,#B42318)] text-xs">
          {generalError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Quick label chips */}
        <div>
          <label className="block text-xs font-mono uppercase tracking-wider text-[var(--sc-ink-2,#4B5060)] mb-1.5">
            Address Label
          </label>
          <div className="flex items-center gap-2 mb-2">
            {["Home", "Office", "Other"].map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => setLabel(chip)}
                className={cn(
                  "px-3 py-1 text-xs rounded-full border transition-colors",
                  label === chip
                    ? "bg-[var(--sc-ink,#111318)] text-[var(--sc-paper,#FAFAF7)] border-[var(--sc-ink,#111318)]"
                    : "bg-[var(--sc-surface,#FFFFFF)] text-[var(--sc-ink-2,#4B5060)] border-[var(--sc-line,#E8E8E1)] hover:border-[var(--sc-ink-2,#4B5060)]"
                )}
              >
                {chip}
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="e.g. Home, Studio, Mom's House"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="w-full h-10 px-3 text-sm rounded-lg border border-[var(--sc-line,#E8E8E1)] bg-[var(--sc-surface,#FFFFFF)] text-[var(--sc-ink,#111318)] focus:outline-none focus:border-[var(--sc-marigold,#F2A900)] focus:ring-1 focus:ring-[var(--sc-marigold,#F2A900)]"
          />
        </div>

        {/* Recipient Name */}
        <div>
          <label
            htmlFor="addr-recipient"
            className="block text-xs font-mono uppercase tracking-wider text-[var(--sc-ink-2,#4B5060)] mb-1"
          >
            Recipient Name *
          </label>
          <input
            id="addr-recipient"
            type="text"
            required
            autoComplete="name"
            placeholder="e.g. Aarav Sharma"
            value={recipientName}
            onChange={(e) => setRecipientName(e.target.value)}
            className="w-full h-11 px-3 text-sm rounded-lg border border-[var(--sc-line,#E8E8E1)] bg-[var(--sc-surface,#FFFFFF)] text-[var(--sc-ink,#111318)] focus:outline-none focus:border-[var(--sc-marigold,#F2A900)] focus:ring-1 focus:ring-[var(--sc-marigold,#F2A900)]"
          />
        </div>

        {/* Phone */}
        <div>
          <label
            htmlFor="addr-phone"
            className="block text-xs font-mono uppercase tracking-wider text-[var(--sc-ink-2,#4B5060)] mb-1"
          >
            Contact Phone *
          </label>
          <div className="relative flex items-center">
            <span className="absolute left-3 text-xs font-mono text-[var(--sc-ink-3,#8B90A0)] select-none">
              +977
            </span>
            <input
              id="addr-phone"
              type="tel"
              required
              inputMode="numeric"
              placeholder="98XXXXXXXX"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                if (phoneError) setPhoneError(null);
              }}
              onBlur={handlePhoneBlur}
              className="w-full h-11 pl-14 pr-3 text-sm font-mono rounded-lg border border-[var(--sc-line,#E8E8E1)] bg-[var(--sc-surface,#FFFFFF)] text-[var(--sc-ink,#111318)] focus:outline-none focus:border-[var(--sc-marigold,#F2A900)] focus:ring-1 focus:ring-[var(--sc-marigold,#F2A900)]"
            />
          </div>
          {phoneError && (
            <p className="text-xs text-[var(--sc-danger,#B42318)] mt-1">{phoneError}</p>
          )}
        </div>

        {/* Cascading Location: Province & District */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="addr-province"
              className="block text-xs font-mono uppercase tracking-wider text-[var(--sc-ink-2,#4B5060)] mb-1"
            >
              Province *
            </label>
            <select
              id="addr-province"
              value={province}
              onChange={(e) => handleProvinceChange(e.target.value)}
              className="w-full h-11 px-3 text-sm rounded-lg border border-[var(--sc-line,#E8E8E1)] bg-[var(--sc-surface,#FFFFFF)] text-[var(--sc-ink,#111318)] focus:outline-none focus:border-[var(--sc-marigold,#F2A900)]"
            >
              {Object.keys(NEPAL_ADMIN_DATA).map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="addr-district"
              className="block text-xs font-mono uppercase tracking-wider text-[var(--sc-ink-2,#4B5060)] mb-1"
            >
              District *
            </label>
            <select
              id="addr-district"
              value={district}
              onChange={(e) => handleDistrictChange(e.target.value)}
              className="w-full h-11 px-3 text-sm rounded-lg border border-[var(--sc-line,#E8E8E1)] bg-[var(--sc-surface,#FFFFFF)] text-[var(--sc-ink,#111318)] focus:outline-none focus:border-[var(--sc-marigold,#F2A900)]"
            >
              {availableDistricts.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Municipality & Ward */}
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <label
              htmlFor="addr-muni"
              className="block text-xs font-mono uppercase tracking-wider text-[var(--sc-ink-2,#4B5060)] mb-1"
            >
              Municipality *
            </label>
            <select
              id="addr-muni"
              value={municipality}
              onChange={(e) => setMunicipality(e.target.value)}
              className="w-full h-11 px-3 text-sm rounded-lg border border-[var(--sc-line,#E8E8E1)] bg-[var(--sc-surface,#FFFFFF)] text-[var(--sc-ink,#111318)] focus:outline-none focus:border-[var(--sc-marigold,#F2A900)]"
            >
              {availableMunicipalities.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="addr-ward"
              className="block text-xs font-mono uppercase tracking-wider text-[var(--sc-ink-2,#4B5060)] mb-1"
            >
              Ward (1-35) *
            </label>
            <input
              id="addr-ward"
              type="number"
              min={1}
              max={35}
              required
              value={ward}
              onChange={(e) => setWard(Math.max(1, Math.min(35, parseInt(e.target.value) || 1)))}
              className="w-full h-11 px-3 text-sm font-mono rounded-lg border border-[var(--sc-line,#E8E8E1)] bg-[var(--sc-surface,#FFFFFF)] text-[var(--sc-ink,#111318)] tabular-nums focus:outline-none focus:border-[var(--sc-marigold,#F2A900)]"
            />
          </div>
        </div>

        {/* Street / Landmark */}
        <div>
          <label
            htmlFor="addr-landmark"
            className="block text-xs font-mono uppercase tracking-wider text-[var(--sc-ink-2,#4B5060)] mb-1"
          >
            Chowk, Tole &amp; Landmark *
          </label>
          <input
            id="addr-landmark"
            type="text"
            required
            placeholder="e.g. Jhamsikhel Chowk, opposite St. Xavier's Gate"
            value={streetLandmark}
            onChange={(e) => setStreetLandmark(e.target.value)}
            className="w-full h-11 px-3 text-sm rounded-lg border border-[var(--sc-line,#E8E8E1)] bg-[var(--sc-surface,#FFFFFF)] text-[var(--sc-ink,#111318)] focus:outline-none focus:border-[var(--sc-marigold,#F2A900)] focus:ring-1 focus:ring-[var(--sc-marigold,#F2A900)]"
          />
        </div>

        {/* Set as Default */}
        <div className="flex items-center gap-2 pt-1">
          <input
            id="addr-default"
            type="checkbox"
            checked={isDefault}
            onChange={(e) => setIsDefault(e.target.checked)}
            className="h-4 w-4 rounded border-[var(--sc-line,#E8E8E1)] text-[var(--sc-ink,#111318)] focus:ring-[var(--sc-marigold,#F2A900)]"
          />
          <label
            htmlFor="addr-default"
            className="text-xs text-[var(--sc-ink-2,#4B5060)] select-none cursor-pointer"
          >
            Set as default delivery address
          </label>
        </div>

        {/* Primary Action Button */}
        <div className="pt-3">
          <button
            type="submit"
            disabled={saving}
            className="w-full h-12 flex items-center justify-center font-medium rounded-lg bg-[var(--sc-ink,#111318)] text-[var(--sc-paper,#FAFAF7)] hover:opacity-95 disabled:opacity-50 transition-opacity"
          >
            {saving
              ? isEditing
                ? "Saving changes..."
                : "Saving address..."
              : isEditing
              ? "Save changes"
              : "Save address"}
          </button>
        </div>
      </form>
    </>
  );
}

export interface AddressSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialAddress?: DeliveryAddressItem | null;
  onSaved: (address: DeliveryAddressItem) => void;
}

export function AddressSheet({
  open,
  onOpenChange,
  initialAddress,
  onSaved,
}: AddressSheetProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs transition-opacity" />

        <Dialog.Content
          className={cn(
            "fixed z-50 bg-[var(--sc-surface,#FFFFFF)] text-[var(--sc-ink,#111318)] shadow-lg overflow-y-auto outline-none transition-all duration-200",
            // Mobile: bottom drawer (< 640px)
            "inset-x-0 bottom-0 max-h-[90dvh] rounded-t-2xl border-t border-[var(--sc-line,#E8E8E1)] p-5 pb-safe sm:rounded-none sm:border-t-0",
            // Desktop: right drawer (>= 640px)
            "sm:inset-y-0 sm:right-0 sm:left-auto sm:w-[440px] sm:max-h-full sm:border-l sm:border-[var(--sc-line,#E8E8E1)] sm:p-6"
          )}
        >
          {open && (
            <AddressForm
              key={initialAddress ? `edit-${initialAddress.id}` : "create"}
              initialAddress={initialAddress}
              onSaved={onSaved}
              onClose={() => onOpenChange(false)}
            />
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
