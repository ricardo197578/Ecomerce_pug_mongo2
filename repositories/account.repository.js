import { AccountModel } from "../models/Account.js";
import { createBaseRepository } from "./base.repository.js";

const base = createBaseRepository(AccountModel);

export const accountRepository = {
  ...base,
  async findByEmail(email) {
    return AccountModel.findOne({ email }).lean();
  }
};
