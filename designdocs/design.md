{
  "designSystem": {
    "name": "Tactile-Playful-Tech",
    "corePrinciples": [
      "Approachable and organic",
      "Tactile depth via soft, diffused shadows",
      "Scrapbook-style overlapping layouts",
      "High-contrast vibrant accents on soft/neutral bases"
    ],
    "colors": {
      "primary": {
        "vibrantBlue": "#3B3DFF",
        "coralRed": "#FF4F40"
      },
      "backgrounds": {
        "cream": "#FDFDF8",
        "softPink": "#F8D4D4",
        "pastelGradient": "linear-gradient(to right, #F8D4D4, #FDFDF8, #E0E7FF)"
      },
      "text": {
        "dark": "#1A1A1A",
        "light": "#FFFFFF",
        "accent": "#FF4F40"
      }
    },
    "typography": {
      "headings": {
        "style": "Bold, heavily weighted display font (rounded sans-serif or soft serif)",
        "characteristics": "Tight tracking, often colored with vibrant accents."
      },
      "body": {
        "style": "Clean, geometric sans-serif",
        "characteristics": "High legibility, regular weight."
      }
    },
    "layoutAndStructure": {
      "heroSections": "Centered alignment, ample whitespace, bold typography acting as the primary anchor.",
      "layering": "Z-index stacking used heavily. Elements float above backgrounds with noticeable depth.",
      "spacing": "Generous padding (e.g., `p-12` or `p-16` in Tailwind) to maintain an airy feel."
    },
    "components": {
      "buttons": {
        "primary": "Solid coral-red, heavily rounded (pill-shaped).",
        "secondary": "White fill, thin stroke/border, rounded corners.",
        "dark": "Dark grey/black fill, pill-shaped, soft shadow or subtle glow."
      },
      "cardsAndContainers": {
        "borderRadius": "Large (16px to 24px).",
        "shadows": "Soft, widespread drop shadows (e.g., `box-shadow: 0 12px 40px rgba(0,0,0,0.12)`).",
        "surfaces": "Mix of opaque vibrant colors, cream, or translucent 'frosted glass' layers."
      },
      "decorativeElements": {
        "dividers": "Wavy or scalloped horizontal edge patterns separating distinct vertical sections.",
        "backgroundPatterns": "Subtle, fine-lined graph paper grids (light blue on cream).",
        "accents": "Rotated, overlapping 'sticker' or 'polaroid' style sub-components placed asymmetrically."
      }
    },
    "aiPromptContext": {
      "goal": "Replicate a friendly, modern, non-corporate tech aesthetic using HTML/CSS or UI frameworks like Tailwind.",
      "replicationRules": [
        "Never use sharp, 90-degree corners for primary containers; default to large border-radii (`rounded-2xl` or higher).",
        "Avoid flat designs; apply soft drop-shadows to floating windows and cards to simulate physical depth.",
        "Implement wavy SVG dividers between contrasting background sections rather than straight lines.",
        "Use absolute positioning and slight rotation (`transform: rotate()`) for scattered decorative elements to create a tactile, scrapbook feel.",
        "Pair highly saturated primary colors (royal blue, coral) with soft pastels and off-whites."
      ]
    }
  }
}