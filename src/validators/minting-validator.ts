import {
  Data,
  MintingPolicy,
  mintingPolicyToId,
  Network,
  OutputDatum,
  validatorToAddress,
} from "@lucid-evolution/lucid";

abstract class MintingValidator<T extends Data[]> {
  readonly #address: string;
  readonly #policy: MintingPolicy;

  protected constructor(
    network: Network,
    policy: MintingPolicy,
    private readonly tokenName: string,
    protected readonly $params: T,
  ) {
    const address = validatorToAddress(network, policy);
    this.#address = address;
    this.#policy = policy;
  }

  get address() {
    return this.#address;
  }

  get policy() {
    return this.#policy;
  }

  get policyId() {
    return mintingPolicyToId(this.policy);
  }

  get token() {
    return this.policyId + this.tokenName;
  }

  get params(): OutputDatum {
    return { kind: "inline", value: Data.to(this.$params) };
  }
}

export { MintingValidator };
