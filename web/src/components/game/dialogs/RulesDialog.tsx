"use client";

import { Dialog, dialogGhost } from "@/components/game/dialogs/Dialog";

interface RuleSection {
  title: string;
  body: string;
}

const RULE_SECTIONS: RuleSection[] = [
  {
    title: "objective",
    body: "buy, rent, and trade until every rival is bankrupt. last player standing wins.",
  },
  {
    title: "turn",
    body: "roll 2 dice · move clockwise · doubles = extra turn · three doubles = jail. pass go → collect $200.",
  },
  {
    title: "property",
    body: "buy at list price or decline → auction. pay rent if owned (unless mortgaged). full colour set = monopoly + double base rent.",
  },
  {
    title: "build",
    body: "houses must be even across a monopoly. 4 houses → hotel. bank has 32 houses / 12 hotels.",
  },
  {
    title: "transport & utilities",
    body: "hubs pay by count owned. utilities pay 4× or 10× the dice when you own both.",
  },
  {
    title: "jail",
    body: "pay $50, use a get-out-free card, or roll doubles. after 3 failed turns you must pay $50 and leave.",
  },
  {
    title: "turn clock",
    body: "each turn lasts 3 minutes. run out of time and you are eliminated, assets back to the bank.",
  },
  {
    title: "bankruptcy",
    body: "can't pay after selling houses and mortgaging → out. assets go to the creditor.",
  },
];

interface RulesDialogProps {
  open: boolean;
  onClose: () => void;
}

export function RulesDialog({ open, onClose }: RulesDialogProps) {
  if (!open) return null;

  return (
    <Dialog
      eyebrow="Reference"
      title="House rules"
      subtitle="Everything the engine enforces, in one page"
      size="lg"
      onClose={onClose}
      footer={
        <button type="button" className={dialogGhost} onClick={onClose}>
          Close
        </button>
      }
    >
      <div className="grid grid-cols-2 gap-x-5 gap-y-4 max-[720px]:grid-cols-1">
        {RULE_SECTIONS.map((section) => (
          <section key={section.title}>
            <h3 className="mb-1 text-[12.5px] font-bold text-body capitalize">
              {section.title}
            </h3>
            <p className="m-0 text-[12.5px] leading-relaxed text-dim">
              {section.body}
            </p>
          </section>
        ))}
      </div>
    </Dialog>
  );
}
