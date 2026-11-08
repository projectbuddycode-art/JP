import Link from "next/link";
import { WhatsAppLink } from "@/components/site/whatsapp";

export function EnquiryCta({
  enquireHref = "/enquire",
  customHref = "/custom-trip",
  path,
}: {
  enquireHref?: string;
  customHref?: string;
  path: string;
}) {
  const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
  return (
    <div className="site-cta-row mt-8">
      <Link href={enquireHref} className="site-btn-gold">
        Enquire now
      </Link>
      <Link href={customHref} className="site-btn-ghost">
        Design a private version
      </Link>
      {whatsapp ? (
        <span className="flex items-center text-sm text-[#3d7ab5]">
          <WhatsAppLink number={whatsapp} path={path} />
        </span>
      ) : null}
    </div>
  );
}
