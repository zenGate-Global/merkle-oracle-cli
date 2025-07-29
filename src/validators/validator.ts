import {
  Data,
  mintingPolicyToId,
  Network,
  OutputDatum,
  Script,
  validatorToAddress,
} from "@lucid-evolution/lucid";

abstract class Validator<T extends Data[]> {
  readonly #address: string;
  readonly #script: Script;

  protected constructor(
    network: Network,
    script: Script,
    protected readonly $params: T,
  ) {
    const address = validatorToAddress(network, script);
    this.#address = address;
    this.#script = script;
  }

  get address() {
    return this.#address;
  }

  get script() {
    return this.#script;
  }

  get scriptHash() {
    return mintingPolicyToId(this.#script);
  }

  get params(): OutputDatum {
    return { kind: "inline", value: Data.to(this.$params) };
  }
}

export { Validator };
