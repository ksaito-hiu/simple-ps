import { rules } from './parser';

//変数
class Var {
  name;
  constructor(name) {
    this.name = name;
  }
}

class Term {
  fun; // 関数名部分
  args; // 引数部分
  constructor(fun,args) {
    this.fun = fun;
    this.args = args;
  }
}

class Rule {
  priority; // 優先度
  lhs; // 条件部(Left hand side)
  rhs; // 実行部(Right hand side)
  constructor(priority,lhs,rhs) {
    this.priority = priority;
    this.lhs = lhs;
    this.rhs = rhs;
  }
}

class Engine {
  constructor(ruleStr) {
    this.rules = rules(ruleStr);
  }
}

export { Engine, Rule, Term, Var };
