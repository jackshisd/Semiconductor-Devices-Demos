# Physics model and course alignment

The simulations follow the supplied EE 121B slides. Concentrations and distances in the calculation library use cm^-3 and cm; voltage uses V, energy uses eV, current density uses A/cm^2. Graph axes convert to µm or scaled concentration where indicated.

| Topic | Course slides | Implemented relation / scope |
| --- | --- | --- |
| Doping, compensation, charge neutrality | Lecture 2, pp. 17–25; Lecture 6, pp. 12–14 | Net ionized doping is N_D − N_A. This is not space charge in a neutral region. |
| Carrier statistics | Lecture 3, pp. 8–19 | n = N_C exp[(E_F−E_C)/kT] and p = N_V exp[(E_V−E_F)/kT] only when the band edge is more than about 3kT from E_F. The degenerate demo integrates the parabolic-band Fermi–Dirac distribution. |
| Density of states and Fermi occupation | Lecture 3, pp. 8–19 | n = ∫ from E_C to ∞ of g_C(E)f(E)dE and p = ∫ from −∞ to E_V of g_V(E)[1−f(E)]dE. The shaded spectral area uses a three-dimensional parabolic-band density of states; the displayed totals use the corresponding complete Fermi–Dirac integral, including when E_F enters a band. |
| Electron and hole distributions (demo0.png reference) | Lecture 3 carrier-statistics material | The combined four-panel view shows band edges, both densities of states, f(E) and 1−f(E), and both carrier spectra. Donor or acceptor doping determines E_F through charge neutrality across 10^14–10^20 cm^-3. The energy gap is explicitly compressed to bring the two band windows closer; within each band window the energy scale is linear. The display identifies the degenerate regime when E_F enters a band. Spectra can be normalized separately for visibility or shown on one shared scale. Numerical totals use the unscaled Fermi–Dirac integrals. |
| Silicon reference values | Intro, p. 11; Lecture 2, p. 11; Lecture 3, p. 10; Lecture 5, p. 36 | At 300 K: E_G = 1.12 eV, N_C = 2.82×10^19 cm^-3, N_V = 1.83×10^19 cm^-3, ε_s = 11.7 ε_0. The density-of-states formula yields n_i ≈ 8.89×10^9 cm^-3, consistent with the slides' rounded 10^10. Temperature-dependent E_G retains the standard Varshni shape, anchored to the course's rounded 300 K value. |
| Drift, diffusion, Einstein relation | Lecture 3, pp. 26–39; Lecture 4, pp. 16–24 | J_n = q μ_n n E + q D_n dn/dx and D_n/μ_n = kT/q. In equilibrium, the two current components cancel. The new demo prescribes an exponential profile to illustrate that cancellation. |
| Minority diffusion | Lecture 5, pp. 5–20 | Under steady state, uniform doping, small field and low-level injection: D_p d²Δp/dx² − Δp/τ_p = 0, L_p = √(D_p τ_p), Δp(x) = Δp(0)e^-x/L_p. |
| Minority transport with a uniform field | Extension of the Lecture 5 zero-field model | The optional field uses J_p = qμ_p pE − qD_p dp/dx and D_pΔp″ − μ_p EΔp′ − Δp/τ_p = 0. Its exponential decay length reduces to √(D_pτ_p) at E = 0. The equilibrium toggle sets the uniform region’s applied field and excess injection to zero, leaving p = n_i²/N_D and J_p = 0. |
| Carrier continuity | Lecture 5, pp. 11–25 | ∂n/∂t = (1/q)∂J_n/∂x + G − R and ∂p/∂t = −(1/q)∂J_p/∂x + G − R. The demo uses a uniform 10 µm slice with prescribed linear current profiles, so the displayed rates are instantaneous local rates rather than a time-integrated solution. The bar derives face-arrow directions from the net current differences. Users prescribe drift contributions to ΔJ, and displayed diffusion contributions are net minus drift. These signed values illustrate current decomposition; separate physical currents require electric field and carrier density gradients. |
| Fermi and quasi-Fermi levels | Lecture 3 carrier statistics; Lecture 5, pp. 21–25 | Donor or acceptor concentration sets the equilibrium Fermi level through n₀−p₀ = N_D or p₀−n₀ = N_A. Equal electron-hole pair injection preserves that net charge and splits F_n and F_p. Carrier densities and level positions use complete parabolic-band Fermi–Dirac integrals; the ideal model omits bandgap narrowing at very high doping. |
| Metal–semiconductor contact | Lecture 5, pp. 26–40; Lecture 6, pp. 4–11 | The ideal n-type barrier is Φ_Bn = Φ_M−χ. Its built-in voltage is Φ_Bn−(E_C−E_F)_bulk/q. Bias changes the depletion drop, not the idealized interface barrier. |
| PN electrostatics | Lecture 6, pp. 14–31 | N_A x_p = N_D x_n, W = √[(2ε_s/q)(1/N_A+1/N_D)(V_bi−V_A)]. The abrupt comparison uses unequal depletion-side widths when doping differs. |
| Ideal diode | Lecture 7, pp. 4–21 | J = J_0(e^(V_A/V_T)−1), J_0 = qn_i²[D_n/(L_nN_A)+D_p/(L_pN_D)]. The demo assumes long quasi-neutral regions, low-level injection, no depletion-region recombination and fixed reference mobilities. |

## Deliberate approximations

- The PN built-in and depletion pages restrict the sliders to nondegenerate doping. The degenerate-junction Fermi–Dirac option omits band-gap narrowing, incomplete ionization and impurity-band physics; it is an ideal-band teaching model, especially at the nominal 10^20 cm^-3 heavily doped side.
- The linear and abrupt doping-profile comparison illustrates shapes over a chosen reference depletion span. The PN depletion page performs the voltage-dependent width calculation.
- The NiSi four-case exercise keeps the problem's specified ε_s = 12(8.85×10^-14) F/cm, while the shared bulk-silicon model uses 11.7ε_0 from the lectures.
- The NiSi/n-Si reference barrier of 0.67 eV is a reported measurement for a particular contact preparation. The NiSi/p-Si 0.45 eV reference is also empirical. Both are adjustable because interface chemistry changes barriers.
- The C–V page is a depletion-capacitance model. The ideal-diode page excludes series resistance and high-level injection. Neither model covers strong forward bias.

## Independent checks

- [MIT OCW drift–diffusion and Einstein relation](https://ocw.mit.edu/courses/6-012-microelectronic-devices-and-circuits-fall-2009/eba3aa6bfb6bc14b799f354d6448958c_MIT6_012F09_lec03.pdf)
- [MIT OCW minority diffusion solution](https://ocw.mit.edu/courses/3-15-electrical-optical-magnetic-materials-and-devices-fall-2006/5d9ea184d37f786009a725bc8e02fb67_ps2_solution.pdf)
- [Georgia Tech continuity and minority-carrier diffusion lecture](https://www.alan.ece.gatech.edu/ECE3080/Lectures/ECE3080-L-10-EquationsOfStateMinorityCarrierDiffusion.pdf)
- [MIT OCW carrier-flow continuity equations](https://ocw.mit.edu/courses/6-720j-integrated-microelectronic-devices-spring-2007/477625fc6080d062ea9bef7e100acd0b_lecture9.pdf)
- [MIT OCW quasi-Fermi level derivation](https://ocw.mit.edu/courses/6-772-compound-semiconductor-devices-spring-2003/f28cc4ae7325640e457b5e14b2d5fa19_lec4_supplement.pdf)
- [MIT OCW PN-diode lecture](https://ocw.mit.edu/courses/6-012-microelectronic-devices-and-circuits-spring-2009/resources/mit6_012s09_lec15/)
- [Ioffe silicon parameters and temperature dependence](https://www.ioffe.ru/SVA/NSM/Semicond/Si/bandstr.html)
- [Measured NiSi/n-Si barrier](https://doi.org/10.1016/S0038-1101(03)00286-7)
- [IBM NiSi electron and hole barrier summary](https://research.ibm.com/publications/interaction-of-nisi-with-dopants-for-metallic-sourcedrain-applications)
- [NIST elementary charge](https://physics.nist.gov/cuu/Constants/Value/e.html)
