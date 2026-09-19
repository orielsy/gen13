# Physics and Math References

Gen13 should make it possible to trace a physical result back to the equation or geometric construction that produced it.

This file records the sources behind the equations currently used by the v0.0 LIGHT solver. The implementation is not inventing new optics; it is translating standard geometrical-optics and ray-intersection equations into deterministic code.

## 1. Snell's law

Used in: `src/solve.ts` when calculating the transmitted/refraction angle.

Standard form:

```text
n1 sin(theta1) = n2 sin(theta2)
```

Where:

- `n1` = refractive index of the material the ray is leaving
- `n2` = refractive index of the material the ray is entering
- `theta1` = incident angle measured from the surface normal
- `theta2` = transmitted/refracted angle measured from the surface normal

Gen13 rearranges this into:

```text
sin(theta2)^2 =
  (n1 / n2)^2 * (1 - cos(theta1)^2)
```

because for a unit direction vector:

```text
sin(theta)^2 = 1 - cos(theta)^2
```

That form lets the solver detect total internal reflection before trying to calculate a transmitted angle.

Reference:

- OpenStax, *University Physics Volume 3*, §1.3 “Refraction”:
  https://openstax.org/books/university-physics-volume-3/pages/1-3-refraction

## 2. Critical angle and total internal reflection

Used in: `src/solve.ts` when `sin(theta2)^2 > 1`.

When light travels from a higher refractive index into a lower one (`n1 > n2`), the critical angle is:

```text
theta_c = asin(n2 / n1)
```

At that angle the transmitted ray would be 90° from the normal. Above it, Snell's law has no real transmitted-angle solution and the ray undergoes total internal reflection.

Reference:

- OpenStax, *University Physics Volume 3*, §1.4 “Total Internal Reflection”:
  https://openstax.org/books/university-physics-volume-3/pages/1-4-total-internal-reflection

OpenStax also collects Snell's law, the law of reflection, the critical-angle relation, and Brewster's law in its key-equations table:

- https://openstax.org/books/university-physics-volume-3/pages/1-key-equations

## 3. Law of reflection / reflection vector

Used in: `reflectedDirection(...)`.

The physical law is:

```text
theta_reflected = theta_incident
```

For normalized vectors, the familiar vector form is:

```text
r = d - 2(d · n)n
```

where `d` is the incoming direction and `n` is the surface normal.

Gen13's implementation looks slightly different because its working normal is oriented toward the incident medium and it already computed:

```text
cosIncident = -(n · d)
```

so the same equation becomes:

```text
r = d + 2 cosIncident n
```

Reference:

- Pharr, Jakob, and Humphreys, *Physically Based Rendering: From Theory to Implementation*, “Specular Reflection and Transmission”:
  https://pbr-book.org/4ed/Reflection_Models/Specular_Reflection_and_Transmission

## 4. Fresnel equations

Used in: `fresnel(...)`.

Snell's law determines the **direction** of the transmitted ray. Fresnel equations determine how much optical power is reflected and transmitted at a dielectric boundary.

For s-polarized light, the amplitude reflection coefficient is:

```text
rs =
  (n1 cos(theta1) - n2 cos(theta2))
  --------------------------------
  (n1 cos(theta1) + n2 cos(theta2))
```

For p-polarized light:

```text
rp =
  (n1 cos(theta2) - n2 cos(theta1))
  --------------------------------
  (n1 cos(theta2) + n2 cos(theta1))
```

Power reflectance is the square of those amplitude coefficients:

```text
Rs = rs^2
Rp = rp^2
```

For the v0.0 assumption of unpolarized light, Gen13 averages the two:

```text
R = (Rs + Rp) / 2
T = 1 - R
```

References:

- RP Photonics Encyclopedia, “Fresnel Equations”:
  https://www.rp-photonics.com/fresnel_equations.html
- Pharr, Jakob, and Humphreys, *Physically Based Rendering*, “Specular Reflection and Transmission”:
  https://pbr-book.org/4ed/Reflection_Models/Specular_Reflection_and_Transmission

## 5. Ray / interface intersection

Used in: `findNearestHit(...)`.

A ray is written parametrically as:

```text
r(t) = origin + t * direction
```

An infinite plane (or, in Gen13's 2D reduction, an infinite line/interface) can be described using a point on the surface and its normal.

Solving for the ray parameter gives:

```text
t =
  ((surfacePoint - rayOrigin) · normal)
  -------------------------------------
          (rayDirection · normal)
```

A positive `t` lies in front of the ray origin. Gen13 evaluates all compatible interfaces and keeps the smallest positive value.

Reference:

- Stanford CS348b, Lecture 2, “Ray-Plane Intersection”:
  https://gfxcourses.stanford.edu/cs348b/spring22content/media/intersection/rt1_3GyBK6F.pdf

The Stanford source presents the equation in 3D. Gen13 uses the same dot-product derivation in 2D; the dimensional reduction does not change the algebra.

## 6. Brewster-angle test

Used in: `tests/solve.test.ts` as an analytic check on the Fresnel implementation.

For light traveling between two dielectric materials:

```text
tan(theta_B) = n2 / n1
```

At Brewster's angle, the p-polarized reflected component goes to zero for the ideal dielectric interface modeled here.

Reference:

- OpenStax, *University Physics Volume 3*, key equations:
  https://openstax.org/books/university-physics-volume-3/pages/1-key-equations

## Why keep this file?

The solver should be understandable as a chain of evidence:

```text
physical law / geometric relation
            ↓
       implementation
            ↓
          Trace
            ↓
     test / explanation
```

When a new physical equation enters Gen13, add the source and the mapping to code here. Tests should prefer independently known analytic results rather than simply snapshotting whatever the implementation currently returns.
