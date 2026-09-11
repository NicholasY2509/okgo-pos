import { IncentiveRuleRepository } from "../repositories/incentive-rule-repository";
import { IncentiveRuleInput } from "../schemas/incentive-rule";

export class IncentiveRuleService {
  static async getRules() {
    return await IncentiveRuleRepository.findMany();
  }

  static async createRule(data: IncentiveRuleInput) {
    return await IncentiveRuleRepository.create(data);
  }

  static async updateRule(id: string, data: IncentiveRuleInput) {
    return await IncentiveRuleRepository.update(id, data);
  }

  static async deleteRule(id: string) {
    return await IncentiveRuleRepository.delete(id);
  }
}
