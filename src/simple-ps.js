import { parse } from './parser';

// 推論システム
// 推論は常に完全に停止して終了するタイプではなく
// ワーキングメモリの状況に変化があれば自動で
// 推論を再開するようにする。
// ただ、無駄にCPUを消費することが無いように、
// ワーキングメモリに変化が無い時は自動で
// スリープ状態にする。
// 上記を実現する方針は、Java版SimplePSを参考に
// するべし。

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
  env; // 変数のバインディングを保持する環境

  constructor(priority,lhs,rhs) {
    this.priority = priority;
    this.lhs = lhs;
    this.rhs = rhs;
  }

  // ワーキングメモリを受け取り、このルールの
  // 適用条件が満されているかチェック。
  checkConditions(wm) {
    const env = {};
    
  }
}

// 処理は全てBuiltInとして実装
class BuiltIn {
  name; // 名前
  constructor(name) {
    this.name = name;
  }
  eval(args,env,wm) {
    // 引数のargs配列と、変数と値のMapである環境envと、
    // ワーキングメモリを表す情報名と値のMapであるwmを
    // 受け取り必要な処理を行う。
    // このBuiltinを条件部で使うならばtrueかfalseを
    // returnすること。処理によっては例外をthrowする
    // ことができるものとする。
  }
}

// 推論エンジン本体。中にルールなど全部入っている。
class Engine {
  rules; // ルール
  builtIns; // ビルトイン
  workingMemory; // ワーキングメモリ
  stopRequest; // 推論の終了リクエスト
  timeCounter; // 推論ステップで進むタイムカウンタ

  constructor(ruleStr) {
    if (ruleStr === undefined)
      this.rules = [];
    else
      this.rules = parse(ruleStr);
    this.builtIns = {};
    this.workingMemory = {};
    this.stopRequest = true; // addInfoToWM()で勝手に動き出さないように。
    this.timeCounter = 0;

    this.addBuiltIn(new SearchBI());
    this.addBuiltIn(new StoreBI());
  }

  // ビルトインを追加
  addBuiltIn(builtIn) {
    this.builtIns[builtIn.name] = builtIn;
  }

  // ワーキングメモリに情報を追加
  addInfoToWM(infoName,value) {
    workingMemory[infoName] = value;
  }

  // ワーキングメモリの内容を文字列でダンプ
  dumpWM() {
    return "not yet implemented!";
  }

  // 推論をスタート
  infer() {
    this.stopRequest = false;
    this.timeCounter = 0;
    setTimeout(()=>{this.inferLoop();},0);
  }

  // 推論のループ
  inferLoop() {
    console.log("GAHA");
    this.timeCounter++;
    if (this.stopRequest === false)
      setTimeout(()=>{this.inferLoop();},0);
  }

  // 推論が停止しないような時に呼び出すと推論を止めます。
  stopInfer() {
    this.stopRequest = true;
  }
}

/************************
 * 以下ビルトインの実装 *
 ************************/

// ワーキングメモリを探索する関数
class SearchBI extends BuiltIn {
  constructor() {
    super("s");
  }
  eval(args,env,wm) {
    if (args.length != 1)
      throw new Error("s(SearchBI) 必ず1つの引数を指定して下さい。");
    if (args[0].constructor.name != "Var")
      throw new Error("s(SearchBI) 引数は変数でなければなりません。");
    const v = wm[args[0].name];
    if (v === undefined)
      return false;
    env[args[0].name] = v;
    return true;
  }
}

// ワーキングメモリに情報をセットする関数
class StoreBI extends BuiltIn {
  constructor() {
    super("st");
  }
  eval(args,env,wm) {
    if (args.length != 1)
      throw new Error("s(SearchBI) 必ず1つの引数を指定して下さい。");
    if (args[0].constructor.name != "Var")
      throw new Error("s(SearchBI) 引数は変数でなければなりません。");
    const v = env[arg[0].name];
    wm[args[0].name] = v;
    return true;
  }
}

// このモジュールからExportするのは以下。ただ
// simple-psパッケージからExportするのはEngine
// とBuiltInだけで良いかも。
export { Engine, Rule, Term, Var, BuiltIn };
