export function FaqList({ faqs }: { faqs: Array<{ q: string; a: string }> }) {
  if (!faqs.length) return null;
  return (
    <section>
      <h2 className="font-serif text-3xl">Questions travellers actually ask</h2>
      <p className="mt-2 max-w-2xl text-sm text-[#6b7a88]">
        Answers describe how Northridge works. They are not live weather, permit or road status.
      </p>
      <dl className="mt-8 space-y-6">
        {faqs.map((faq) => (
          <div key={faq.q} className="border-t border-[#d7e2ee] pt-5">
            <dt className="font-serif text-2xl">{faq.q}</dt>
            <dd className="mt-2 max-w-3xl leading-relaxed text-[#5c6b7a]">{faq.a}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
