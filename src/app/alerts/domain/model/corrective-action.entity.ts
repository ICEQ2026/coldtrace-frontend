export class CorrectiveAction {
  constructor(
    private readonly _description: string,
    private readonly _responsible: string,
    private readonly _result: string,
    private readonly _appliedAt: string,
  ) {}

  get description(): string {
    return this._description;
  }

  get responsible(): string {
    return this._responsible;
  }

  get result(): string {
    return this._result;
  }

  get appliedAt(): string {
    return this._appliedAt;
  }
}
