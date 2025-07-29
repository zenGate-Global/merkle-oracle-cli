import { Network, slotToUnixTime } from "@lucid-evolution/lucid";

interface TimeParameters {
  currentSlot: number;
  futureSlot: number;
  currentSlotUnix: number;
  futureSlotUnix: number;
  midSlotUnix: number;
}

const getValidityRange = (
  currentSlot: number,
  toleranceMs: number,
  network: Network,
): TimeParameters => {
  const currentSlotUnix = slotToUnixTime(network, currentSlot);
  const futureSlot = currentSlot + toleranceMs / 1000;
  const futureSlotUnix = slotToUnixTime(network, futureSlot);
  const midSlotUnix = (currentSlotUnix + futureSlotUnix) / 2;

  return {
    currentSlot,
    futureSlot,
    currentSlotUnix,
    futureSlotUnix,
    midSlotUnix,
  };
};

export { getValidityRange };
