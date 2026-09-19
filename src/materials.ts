import type { Material, MaterialId } from "./scene";

/**
 * 589.3 nm is the sodium D-line reference wavelength commonly used when
 * quoting refractive indices for optical materials.
 *
 * v0.0 still treats each material's IOR as constant; this reference keeps the
 * data model honest about what those values represent.
 */
const REFERENCE_WAVELENGTH_NM = 589.3;

/**
 * Small starter table for experiments and tests.
 *
 * These are intentionally data, not behavior. The solver asks
 * iorAtWavelength(...) for the value instead of embedding material knowledge.
 */
export function createDefaultMaterials(): Record<MaterialId, Material> {
  return {
    air: {
      id: "air",
      name: "Air",
      ior: {
        model: "constant",
        value: 1.000293,
        referenceWavelengthNm: REFERENCE_WAVELENGTH_NM,
      },
    },
    water: {
      id: "water",
      name: "Water",
      ior: {
        model: "constant",
        value: 1.333,
        referenceWavelengthNm: REFERENCE_WAVELENGTH_NM,
      },
    },
    bk7: {
      id: "bk7",
      name: "BK7 glass",
      ior: {
        model: "constant",
        value: 1.5168,
        referenceWavelengthNm: REFERENCE_WAVELENGTH_NM,
      },
    },
    diamond: {
      id: "diamond",
      name: "Diamond",
      ior: {
        model: "constant",
        value: 2.417,
        referenceWavelengthNm: REFERENCE_WAVELENGTH_NM,
      },
    },
  };
}

/**
 * This function is deliberately more general than v0.0 needs.
 *
 * Today it returns a constant. Later this can evaluate a dispersion equation
 * (for example Sellmeier) without forcing callers to change how they ask for
 * refractive index.
 */
export function iorAtWavelength(material: Material, wavelengthNm: number): number {
  void wavelengthNm;
  return material.ior.value;
}
