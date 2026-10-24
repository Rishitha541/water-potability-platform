"""
Rule-based guideline check + skin/hair/drinking advisories + final verdict.

Limits follow BIS IS 10500 (India) and WHO / US EPA guidance. Two levels:
  caution = above the ideal/acceptable value
  breach  = above the hard limit (or outside the pH range)
Double-check these numbers against the standard you cite in your report.
"""

DISCLAIMER = (
    "Screening tool only, not a lab test or medical advice. It cannot detect "
    "bacteria, lead, pesticides or other contaminants outside these 9 parameters. "
    "For persistent skin problems, consult a doctor."
)

MIN_READINGS_FOR_CLEAR = 7  # need at least this many readings to say "no issues found"

LABELS = {
    "ph": "pH", "Hardness": "Hardness", "Solids": "Solids (TDS)",
    "Chloramines": "Chloramines", "Sulfate": "Sulfate",
    "Conductivity": "Conductivity", "Organic_carbon": "Organic carbon",
    "Trihalomethanes": "Trihalomethanes", "Turbidity": "Turbidity",
}
UNITS = {
    "ph": "", "Hardness": "mg/L", "Solids": "ppm", "Chloramines": "mg/L",
    "Sulfate": "mg/L", "Conductivity": "µS/cm", "Organic_carbon": "mg/L",
    "Trihalomethanes": "µg/L", "Turbidity": "NTU",
}

# (parameter, direction, threshold, level, status, drinking advice, skin/hair advice)
# For the same parameter+direction, list the "breach" row BEFORE the "caution" row.
CHECKS = [
    # ---- pH (acceptable range 6.5-8.5) ----
    ("ph", "low", 6.5, "breach", "Acidic (below 6.5)",
     "Sour or metallic taste; acidic water can leach metals from pipes.",
     "May irritate skin and eyes; copper leaching can tint hair green or blue."),
    ("ph", "high", 8.5, "breach", "Alkaline (above 8.5)",
     "Bitter or soda-like taste; usually low health risk.",
     "May leave skin dry and tight and hair rough; can aggravate eczema in sensitive people."),

    # ---- Hardness (BIS: 200 acceptable, 600 permissible) ----
    ("Hardness", "high", 600, "breach", "Very hard water",
     "Not a health risk by itself, but heavy scaling and a mineral taste.",
     "Likely dry, itchy skin, soap scum, dull and brittle hair; some studies link hard water to eczema (evidence is mixed)."),
    ("Hardness", "high", 200, "caution", "Hard water",
     "Not a health risk; causes scale and a mineral taste.",
     "May cause dry or itchy skin and dull hair, especially with sensitive skin."),

    # ---- Solids / TDS (BIS: 500 acceptable, 2000 permissible) ----
    ("Solids", "high", 2000, "breach", "Very high dissolved solids",
     "Salty or bitter, often unpalatable; not recommended for regular drinking.",
     "Same drying and residue effects as hard water, stronger."),
    ("Solids", "high", 500, "caution", "High dissolved solids",
     "Noticeable salty, bitter or mineral taste.",
     "May contribute to dry skin and residue on skin and hair."),

    # ---- Chloramines (WHO 3 mg/L, US EPA limit 4 mg/L) ----
    ("Chloramines", "high", 4, "breach", "Above the 4 mg/L limit",
     "Strong chlorine taste and odor; irritation of eyes and stomach at higher levels.",
     "Can dry and irritate skin and eyes and dry out hair; may trigger rashes in sensitive people."),
    ("Chloramines", "high", 3, "caution", "Above the 3 mg/L WHO guideline",
     "Chlorine taste and odor.",
     "May dry or irritate sensitive skin and eyes."),

    # ---- Sulfate (BIS: 200 acceptable, 400 permissible) ----
    ("Sulfate", "high", 400, "breach", "High sulfate",
     "Bitter taste; laxative effect and diarrhea, especially in infants.",
     "Little direct effect on skin."),
    ("Sulfate", "high", 200, "caution", "Elevated sulfate",
     "May taste bitter.",
     "Little direct effect on skin."),

    # ---- Conductivity (no direct limit; derived from the TDS limits) ----
    ("Conductivity", "high", 3000, "breach", "Very high conductivity",
     "Indicates very high dissolved salts, like very high TDS.",
     "May contribute to dry skin and residue."),
    ("Conductivity", "high", 800, "caution", "High conductivity",
     "Indicates elevated dissolved salts (roughly TDS above 500).",
     "May contribute to dry skin and residue."),

    # ---- Organic carbon (no formal limit; heuristic) ----
    ("Organic_carbon", "high", 4, "caution", "High organic carbon",
     "Can signal contamination and reacts with chlorine to form harmful by-products.",
     "No direct skin effect known."),

    # ---- Trihalomethanes (US EPA limit 80 µg/L) ----
    ("Trihalomethanes", "high", 80, "breach", "Above the 80 µg/L limit",
     "Long-term drinking exposure is linked to liver, kidney and cancer risk.",
     "Can be absorbed through skin and inhaled in hot showers; may irritate skin."),

    # ---- Turbidity (BIS/WHO: 1 NTU ideal, 5 NTU upper limit) ----
    ("Turbidity", "high", 5, "breach", "Cloudy (above 5 NTU)",
     "Can shelter bacteria and parasites and weakens disinfection; drinking may cause stomach illness.",
     "Bathing in it may cause skin, eye or ear infections and rashes."),
    ("Turbidity", "high", 1, "caution", "Slightly cloudy (above 1 NTU)",
     "Reduces disinfection effectiveness.",
     "Generally low risk for skin, but avoid if it looks visibly cloudy."),
]


def evaluate_readings(readings: dict) -> list:
    """Compare each provided reading with the limits. Returns a list of flags."""
    flags, seen = [], set()
    for param, direction, threshold, level, status, drinking, skin_hair in CHECKS:
        value = readings.get(param)
        if value is None or (param, direction) in seen:
            continue
        outside = value > threshold if direction == "high" else value < threshold
        if not outside:
            continue
        seen.add((param, direction))
        unit = UNITS[param]
        flags.append({
            "parameter": LABELS[param],
            "value": float(value),
            "unit": unit,
            "level": level,
            "status": status,
            "limit": f"{'above' if direction == 'high' else 'below'} {threshold} {unit}".strip(),
            "drinking": drinking,
            "skin_hair": skin_hair,
        })
    flags.sort(key=lambda f: f["level"] != "breach")  # breaches first
    return flags


def decide_verdict(flags: list, confident_potable: bool, provided_count: int):
    """
    Three-way verdict. Rules come first, the ML model is only a secondary signal,
    and the app never says "safe to drink".
    """
    breaches = [f["parameter"] for f in flags if f["level"] == "breach"]
    if breaches:
        return "not_recommended", (
            f"Not recommended: {', '.join(breaches)} outside guideline limits."
        )

    cautions = [f["parameter"] for f in flags]
    if cautions:
        return "uncertain", (
            f"Uncertain: {', '.join(cautions)} above the ideal range. Get a lab test."
        )

    if provided_count < MIN_READINGS_FOR_CLEAR:
        return "uncertain", (
            f"Uncertain: only {provided_count} of 9 readings entered. "
            f"Enter at least {MIN_READINGS_FOR_CLEAR} or get a lab test."
        )

    if confident_potable:
        return "no_issues_found", (
            "No issues found in these readings. This is a screening result, "
            "not a guarantee that the water is safe."
        )

    return "uncertain", (
        "Uncertain: readings are within limits, but the model is not confident. "
        "Get a lab test."
    )