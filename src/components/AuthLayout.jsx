import React from "react";

export default function AuthLayout({ icon: Icon, title, subtitle, footer, children }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-[minmax(0,1fr)_520px] bg-slate-950">
      <div className="hidden lg:flex relative overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&w=1600&q=80"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-slate-950/65" />
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-300">Juhl & Damsgaard</p>
            <h1 className="mt-5 max-w-xl text-5xl font-bold leading-tight tracking-tight">Internt arbejdsrum for Juhl & Damsgaard.</h1>
          </div>
          <p className="max-w-lg text-sm leading-6 text-slate-200">
            Her styrer vi opgaver, tilbud, faktura, medarbejdere, kvalitetssikring og økonomi i vores entreprenørarbejde.
          </p>
        </div>
      </div>
      <div className="flex items-center justify-center bg-slate-50 px-4 py-10">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-slate-950 mb-5">
              <Icon className="w-6 h-6 text-amber-300" aria-hidden="true" />
            </div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Juhl & Damsgaard</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">{title}</h1>
            {subtitle && <p className="text-slate-600 mt-2">{subtitle}</p>}
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8">
            {children}
          </div>
          {footer && (
            <p className="text-center text-sm text-slate-600 mt-6">{footer}</p>
          )}
        </div>
      </div>
    </div>
  );
}
