'use client';

import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useEffect, useState } from 'react';

const RaspberryPiScene = dynamic(() => import('../components/RaspberryPiScene'), {
  ssr: false,
});

const featureCards = [
  {
    title: 'Hardware fingerprints',
    description:
      'Bind every capture to the device that took it with secure attestation data protected on-chain.',
    icon: '🔐',
  },
  {
    title: 'Realtime authenticity',
    description:
      'Upload a photo and receive cryptographic validation in seconds—no manual review required.',
    icon: '⚡',
  },
  {
    title: 'Tamper alarms',
    description:
      'Spot stripping, edits, and recycled metadata instantly with our integrity heuristics.',
    icon: '🛡️',
  },
  {
    title: 'Portable proof badges',
    description:
      'Share verifiable proof metadata with marketplaces, newsrooms, or legal workflows.',
    icon: '🎯',
  },
];

const verificationSteps = [
  {
    title: 'Drop in your photo',
    description: 'Select the original image directly from your camera roll or device storage.',
    action: 'Upload',
  },
  {
    title: 'We validate the signature',
    description: 'Device attestations, firmware version, and nonce are checked against the Proof of Capture contract.',
    action: 'Verify',
  },
  {
    title: 'Receive proof metadata',
    description: 'Get a human-friendly card plus raw JSON proof for any downstream system.',
    action: 'Share',
  },
];

const trustSignals = [
  {
    label: 'Staked security',
    value: '0.01 ETH',
    caption: 'Every verifier locks capital before issuing proofs.',
  },
  
  {
    label: 'Latency',
    value: '< 6s',
    caption: 'Average verification time end-to-end.',
  },
];

export default function Home() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#020512] text-white">
      <div className="pointer-events-none absolute inset-x-[-20%] top-[-35%] h-[520px] rounded-full bg-gradient-to-br from-violet-500/40 via-purple-500/30 to-indigo-500/30 blur-3xl"></div>
      <div className="pointer-events-none absolute inset-y-[-30%] right-[-25%] w-[520px] rounded-full bg-gradient-to-br from-blue-500/20 via-cyan-500/20 to-teal-400/20 blur-[120px]"></div>

      <header className="relative z-30">
        <div className="mx-auto flex max-w-6xl items-start justify-between p py-9">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="Melon logo" width={56} height={56} className="h-14 w-14" priority />
            <p className="text-sm uppercase  text-white/50">Melon</p>
          </div>
      
        </div>
      </header>

      <main className="relative z-20">
        <section className="px-6 pt-8 pb-20 sm:px-8 sm:pt-12 lg:px-10 lg:pt-18 xl:pt-20">
          <div className="mx-auto grid max-w-6xl items-start gap-16 lg:grid-cols-[1.05fr_0.95fr]">
            <div className={`flex flex-col space-y-8 transition-all duration-700 ${isMounted ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'} lg:space-y-8`}>
              <div className="inline-flex self-start items-center gap-3 rounded-full border border-white/20 bg-white/5 px-5 py-2 text-sm text-white/70 backdrop-blur">
                <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400"></span>
                Live onchain verification
              </div>
              <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl md:text-6xl lg:text-[4.2rem] lg:leading-[1.05]">
                <span className="block">Proof that your photo</span>
                <span className="font-itc-garamond tracking-[-0.05em] text-[0.92em] text-white/90">
                  was captured on the device you claim.
                </span>
              </h1>
              <p className="max-w-xl text-lg text-white/70 sm:text-xl">
                Upload a capture, and we map its hardware fingerprint, firmware, and metadata against a staked Proof of
                Capture smart contract. Share a tamper-proof receipt the moment it verifies.
              </p>
              <div className="flex flex-col gap-4 sm:flex-row">
                <button className="relative inline-flex items-center justify-center overflow-hidden rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-600 px-8 py-3 text-base font-medium shadow-lg shadow-purple-600/40 transition hover:scale-[1.01] hover:shadow-purple-500/60">
                  <span className="relative z-10">Register Device</span>
                  <span className="absolute inset-0 bg-gradient-to-r from-indigo-400/20 via-violet-400/20 to-purple-400/20 opacity-0 transition group-hover:opacity-100"></span>
                </button>
                <button className="inline-flex items-center justify-center rounded-full border border-white/20 px-8 py-3 text-base font-medium text-white/70 transition hover:border-white/40 hover:text-white">
                  Verify a photo
                </button>
              </div>
              <div className="mt-50 flex flex-wrap gap-6 text-sm text-white/60 lg:mt-65 lg:flex-col lg:items-start lg:gap-6 lg:self-center lg:text-base lg:min-h-[240px] lg:justify-start">
                {trustSignals.map((signal) => (
                  <div key={signal.label} className="space-y-1">
                    <p className="text-xs uppercase tracking-[0.3em] text-white/40">{signal.label}</p>
                    <p className="text-2xl font-semibold text-white">{signal.value}</p>
                    <p>{signal.caption}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className={`relative mx-auto w-full max-w-[520px] space-y-35 transition-all duration-700 ${isMounted ? 'translate-y-0 opacity-100 delay-150' : 'translate-y-6 opacity-0'} lg:space-y-38`}>
              <div className="relative space-y-6">
                
                <div className="relative h-[520px] w-full sm:h-[540px]">
                  <RaspberryPiScene />
                </div>
              </div>

              <div className="relative mx-auto w-full max-w-[320px] overflow-hidden rounded-[24px] border border-white/15 bg-white/[0.06] p-3.5 backdrop-blur-xl shadow-[0_20px_40px_-20px_rgba(76,29,149,0.45)]">
                <div className="mb-6 flex items-center justify-between text-xs uppercase tracking-[0.35em] text-white/40">
                  <span>Verification preview</span>
                  <span>01: Proof sheet</span>
                </div>
                <div className="aspect-[4/5] overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-500/60 via-purple-500/60 to-sky-500/60">
                  <div className="flex h-full flex-col justify-between p-4">
                    <div className="flex items-center justify-between text-sm text-white/80">
                      <span className="rounded-full bg-white/15 px-4 py-1">Device match</span>
                      <span className="rounded-full bg-black/30 px-3 py-1 text-white/70">Nonce #48219</span>
                    </div>
                    <div className="space-y-4">
                      <p className="text-2xl font-semibold">Capture confirmed ✅</p>
                      <div className="grid grid-cols-2 gap-4 text-xs uppercase tracking-wide text-white/70">
                        <div>
                          <p className="text-white/40">Device ID</p>
                          <p className="text-base font-medium text-white">SONY-A7RV-118</p>
                        </div>
                        <div>
                          <p className="text-white/40">Firmware</p>
                          <p className="text-base font-medium text-white">v2.4.6</p>
                        </div>
                        <div>
                          <p className="text-white/40">Timestamp</p>
                          <p className="text-base font-medium text-white">2025·09·12 18:22 UTC</p>
                        </div>
                        <div>
                          <p className="text-white/40">Image hash</p>
                          <p className="text-sm font-medium text-white">0x9f2b...a61c</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-6 grid gap-3 text-sm text-white/70">
                  <div className="flex items-center justify-between">
                    <span>Proof transaction</span>
                    <span className="font-medium text-white">0x42fe...a223</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Stake locked</span>
                    <span className="font-medium text-white">1.00 ETH</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Status</span>
                    <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 px-3 py-1 text-emerald-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                      Verified
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="relative overflow-hidden border-t border-white/10 bg-white/[0.03] px-6 py-24 sm:px-8 sm:py-28 lg:px-10">
          <div className="pointer-events-none absolute inset-x-[10%] top-[-25%] h-[360px] rounded-full bg-gradient-to-r from-purple-500/20 via-indigo-500/20 to-sky-500/20 blur-[120px]"></div>
          <div className="relative mx-auto max-w-6xl">
            <div className={`mx-auto max-w-3xl text-center transition-all duration-700 ${isMounted ? 'translate-y-0 opacity-100 delay-100' : 'translate-y-6 opacity-0'}`}>
              <p className="text-sm uppercase tracking-[0.4em] text-white/40">Why photoproof</p>
              <h2 className="mt-4 text-3xl font-semibold text-white sm:text-4xl md:text-5xl">
                A trust layer designed for journalists, marketplaces, and creative networks.
              </h2>
              <p className="mt-6 text-lg text-white/70">
                Inspired by clean, cinematic storytelling. Every section breathes, every card feels tactile, and every
                interaction is ready for the verification workflow you described.
              </p>
            </div>
            <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:gap-8">
              {featureCards.map((feature) => (
                <article
                  key={feature.title}
                  className={`group relative overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.05] p-8 backdrop-blur-xl transition hover:border-white/30 hover:bg-white/[0.08] ${isMounted ? 'translate-y-0 opacity-100 delay-150' : 'translate-y-6 opacity-0'}`}
                >
                  <div className="absolute right-8 top-8 text-4xl opacity-40 transition group-hover:opacity-60">{feature.icon}</div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-2xl">
                    {feature.icon}
                  </div>
                  <h3 className="mt-6 text-xl font-semibold text-white sm:text-2xl">{feature.title}</h3>
                  <p className="mt-3 text-sm text-white/70 sm:text-base">{feature.description}</p>
                  <div className="mt-8 inline-flex items-center gap-3 text-sm font-medium text-indigo-200">
                    Learn more
                    <span aria-hidden="true" className="text-base">
                      →
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="flow" className="relative px-6 py-24 sm:px-8 sm:py-28 lg:px-10">
          <div className="relative mx-auto max-w-6xl">
            <div className={`grid gap-12 lg:grid-cols-[0.9fr_1.1fr] ${isMounted ? 'opacity-100' : 'opacity-0'}`}>
              <div className="space-y-6">
                <p className="text-sm uppercase tracking-[0.35em] text-white/40">Verification flow</p>
                <h2 className="text-3xl font-semibold text-white sm:text-4xl md:text-5xl">
                  From upload to proof in three elegant steps.
                </h2>
                <p className="text-lg text-white/70">
                  We distilled the experience into a cinematic progression inspired by your reference: generous spacing,
                  rich gradients, and tactile cards that lead the eye through each action.
                </p>
                <div className="rounded-[26px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
                  <p className="text-xs uppercase tracking-[0.4em] text-white/40">Next up</p>
                  <p className="mt-4 text-lg font-medium text-white">
                    Build the verification modal that appears when the user clicks “Verify a photo”.
                  </p>
                  <p className="mt-3 text-sm text-white/60">
                    Hook it into your Proof of Capture contract to read and write proof metadata on-chain.
                  </p>
                </div>
              </div>
              <div className="grid gap-6">
                {verificationSteps.map((step, index) => (
                  <div
                    key={step.title}
                    className={`group relative overflow-hidden rounded-[26px] border border-white/10 bg-white/[0.05] p-6 backdrop-blur-xl transition hover:border-white/25 hover:bg-white/[0.08] ${isMounted ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0'}`}
                    style={{ transitionDelay: `${index * 80}ms` }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-lg font-semibold text-white/70">
                          {index + 1}
                        </span>
                        <div>
                          <h3 className="text-xl font-semibold text-white">{step.title}</h3>
                          <p className="mt-1 text-sm text-white/65">{step.description}</p>
                        </div>
                      </div>
                      <span className="rounded-full border border-white/20 px-4 py-1 text-xs uppercase tracking-widest text-white/60">
                        {step.action}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="cta" className="relative overflow-hidden border-y border-white/10 bg-gradient-to-br from-[#0b0d1f] via-[#0f172a] to-[#110b22] px-6 py-24 sm:px-8 sm:py-28 lg:px-10">
          <div className="pointer-events-none absolute inset-x-[5%] top-1/2 h-[420px] -translate-y-1/2 rounded-full bg-gradient-to-r from-violet-500/20 via-fuchsia-500/20 to-indigo-500/20 blur-[140px]"></div>
          <div className="relative mx-auto grid max-w-5xl gap-10 text-center">
            <div className={`space-y-6 ${isMounted ? 'opacity-100 delay-150' : 'opacity-0'}`}>
              <p className="text-sm uppercase tracking-[0.35em] text-white/40">Ready when you are</p>
              <h2 className="text-3xl font-semibold text-white sm:text-4xl md:text-5xl">
                Let’s craft the verification experience next.
              </h2>
              <p className="mx-auto max-w-2xl text-lg text-white/70">
                The landing page now mirrors the minimalist, glassy aesthetic from the reference. From here, we can wire
                the CTA to your upload + verification flow, connect wallets, and surface on-chain proof cards.
              </p>
            </div>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <button className="inline-flex items-center justify-center rounded-full bg-white px-8 py-3 text-base font-semibold text-slate-900 transition hover:bg-slate-200">
                Build verification UI
              </button>
              <button className="inline-flex items-center justify-center rounded-full border border-white/30 px-8 py-3 text-base font-medium text-white/70 transition hover:border-white/50 hover:text-white">
                View contract docs
              </button>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-20 px-6 py-16 sm:px-8 sm:py-20 lg:px-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-10 border-t border-white/10 pt-10 text-sm text-white/50 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-base font-semibold text-white">Melon</p>
            <p className="mt-2 max-w-sm text-white/60">
              Hardware-attested capture proofing for teams that need trusted imagery.
            </p>
          </div>
          <div className="flex gap-8">
            <a href="#" className="transition hover:text-white">
              Privacy
            </a>
            <a href="#" className="transition hover:text-white">
              Terms
            </a>
            <a href="#" className="transition hover:text-white">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
