"use client";

interface WelcomeDialogProps {
  onCreate: () => void;
  onJoin: () => void;
}

/**
 * The card is one fixed-aspect illustration, so it has to be sized against the
 * viewport's height as well as its width — `60vh` keeps the artwork fully on
 * screen on short or ultrawide displays, and `92vw` keeps it off the edges on
 * phones. Everything inside is positioned in percentages so the buttons stay on
 * the shapes painted into the image at every size.
 */
export function WelcomeDialog({ onCreate, onJoin }: WelcomeDialogProps) {
  return (
    <div className="relative h-dvh w-screen">
      <div className="absolute inset-0 m-auto h-fit w-[min(92vw,60vh,460px)] overflow-hidden rounded-2xl bg-white pb-[1%] @container">
        <img
          src="/landing/landing3.png"
          alt=""
          className="h-full w-full object-cover"
          draggable={false}
        />
        <div className="absolute inset-x-0 bottom-[3.6%] flex items-center justify-between px-[9%] text-[clamp(10px,3.4cqw,17px)] font-extrabold text-white">
          <button
            type="button"
            className="flex flex-1 items-center justify-center px-[3%] py-[2%] text-center leading-tight transition-opacity hover:opacity-90"
            onClick={onCreate}
          >
            Create a lobby
          </button>
          <button
            type="button"
            className="flex flex-1 items-center justify-center px-[3%] py-[2%] text-center leading-tight transition-opacity hover:opacity-90"
            onClick={onJoin}
          >
            Join with a code
          </button>
        </div>
      </div>
    </div>
  );
}
