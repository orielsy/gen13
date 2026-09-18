import type { Material, MaterialId } from "./scene";

const REFERENCE_WAVELENGTH_NM = 589.3;

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

export function iorAtWavelength(material: Material, wavelengthNm: number): number {
  // v0.0 deliberately starts with constant IOR values. The wavelength stays
  // explicit in the contract so dispersion models can be introduced later
  // without changing the solver's call shape.
  void wavelengthNm;
  return material.ior.value;
}
