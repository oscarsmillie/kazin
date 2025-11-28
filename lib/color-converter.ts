/**
 * Convert oklch color function to RGB hex
 * oklch(lightness chroma hue) -> #RRGGBB
 */
export function oklchToRgb(oklchString: string): string {
  const match = oklchString.match(/oklch\s*$$\s*([\d.]+)%?\s+([\d.]+)\s+([\d.]+)\s*$$/)
  if (!match) return oklchString

  const [, lightness, chroma, hue] = match
  const l = Number.parseFloat(lightness) / 100
  const c = Number.parseFloat(chroma)
  const h = Number.parseFloat(hue)

  // Convert oklch to linear RGB
  const hueRad = (h * Math.PI) / 180

  // oklch to lms
  const lms = [l + c * Math.cos(hueRad), l - c * 0.3 * Math.sin(hueRad), l - c * 0.3 * Math.sin(hueRad)]

  // lms to linear rgb (simplified conversion)
  const rgb = [lms[0] * lms[0] * lms[0], lms[1] * lms[1] * lms[1], lms[2] * lms[2] * lms[2]]

  // Clamp and convert to 0-255
  const toHex = (val: number) => {
    const clamped = Math.max(0, Math.min(1, val))
    const byte = Math.round(clamped * 255)
    return byte.toString(16).padStart(2, "0")
  }

  return `#${toHex(rgb[0])}${toHex(rgb[1])}${toHex(rgb[2])}`
}

/**
 * Remove or convert oklch colors in HTML/CSS to make it PDF-compatible
 */
export function stripOklchColors(html: string): string {
  return (
    html
      // Fixed regex pattern - was using invalid $$ syntax, now uses proper $$ and $$
      .replace(/oklch\s*$$[^)]+$$/g, (match) => {
        // Map common oklch values to hex colors
        const oklchMap: Record<string, string> = {
          "oklch(100% 0 0)": "#ffffff", // white
          "oklch(14.5% 0 0)": "#252525", // dark
          "oklch(98.5% 0 0)": "#fafafa", // off-white
          "oklch(20.5% 0 0)": "#353535", // darker
          "oklch(97% 0 0)": "#f5f5f5", // light gray
          "oklch(55.6% 0 0)": "#8f8f8f", // medium gray
          "oklch(92.2% 0 0)": "#ebebeb", // border gray
          "oklch(70.8% 0 0)": "#b3b3b3", // ring gray
          "oklch(57.7% 0.245 27.325)": "#d32f2f", // red
          "oklch(39.6% 0.141 25.723)": "#c62828", // dark red
          "oklch(63.7% 0.237 25.331)": "#ef5350", // light red
          "oklch(64.6% 0.222 41.116)": "#f59e0b", // chart-1 orange
          "oklch(60% 0.118 184.704)": "#06b6d4", // chart-2 cyan
          "oklch(39.8% 0.07 227.392)": "#3b82f6", // chart-3 blue
          "oklch(82.8% 0.189 84.429)": "#84cc16", // chart-4 lime
          "oklch(76.9% 0.188 70.08)": "#eab308", // chart-5 yellow
          "oklch(48.8% 0.243 264.376)": "#8b5cf6", // dark chart-1 purple
          "oklch(69.6% 0.17 162.48)": "#14b8a6", // dark chart-2 teal
          "oklch(62.7% 0.265 303.9)": "#d946ef", // dark chart-4 magenta
          "oklch(64.5% 0.246 16.439)": "#f97316", // dark chart-5 orange
        }

        // Try exact match first
        if (oklchMap[match]) {
          return oklchMap[match]
        }

        // Try to convert dynamically
        try {
          return oklchToRgb(match)
        } catch {
          // Fallback to black if conversion fails
          return "#000000"
        }
      })
      .replace(/var\s*$$[^)]+$$/g, "#000000")
  ) // Replace CSS variables with black
}

/**
 * Remove all style tags and links that might contain oklch colors
 */
export function removeStylesWithOklch(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "") // Remove all style tags
    .replace(/<link[^>]*rel="stylesheet"[^>]*>/gi, "") // Remove stylesheet links
}
