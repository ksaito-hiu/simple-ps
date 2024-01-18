/*
 * 文字列を受け取りRuleの配列を返すパーサであるrules()関数を提供。
 * もしエラーがあったらエラーメッセージの文字列を返す。
 */
import { Rule, Term, Var } from './simple-ps';

// 識別子の最初の文字にマッチする正規表現
const rx_id1st = new RegExp('[a-zA-Z_\u00c0-\u1fff\u3040-\u318f\u3400-\u3d2d\u4e00-\u9fff\uf900-\ufaff]');
// 識別子の2文字目以降の文字にマッチする正規表現
const rx_id2nd = new RegExp('[a-zA-Z_\u00c0-\u1fff\u3040-\u318f\u3400-\u3d2d\u4e00-\u9fff\uf900-\ufaff0-9]');
// 数字と判定される文字にマッチする正規表現
const rx_num = new RegExp('[0-9]');

// 再帰下降構文解析で解析する。方針としてグローバル変数の
// inputStrに解析文字列を入れといて、基本1文字ずつ解析。
// その文字の位置を常にグローバル変数のidx変数に保存。
// 解析関数はinputStr.charAt(idx)から
// 解析を始める。その時に必要であれば解析が失敗することを
// 考慮してidxをidxBackupに保存しておく。もし、解析が成功
// したらidxは次に解析される文字の所まで進めておく義務がある。
// なおかつreturnで解析結果を返す。もし、解析が失敗したら
// エラーメッセージをグローバル変数のerrorMessageに書き込み、
// バックアップしていたidxBackupをidxに代入して戻しておく。
// なおかつreturnでnullを返すことにする。

let inputStr; // 解析する文字列(普通は\nが入った複数行の文字列)
let idx; // 現在解析しているinputStr中の一文字の場所
let errorMessage; // エラーメッセージを記録しておく場所

// 現在解析している場所の行番号と列番号を文字列で返す関数。
// エラーメッセージ作る時に使おう。
function lineColumnNo() {
  let line = 1;
  let column = 1;
  for (let i=0;i<idx;i++) {
    if (inputStr.charAt(i)==='\n') {
      line++;
      column = 1;
    } else {
      column++;
    }
  }
  return ""+line+":"+column;
}

// 指定した1文字を検出する解析関数
function char(c) {
  if (inputStr.charAt(idx)===c) {
    idx++;
    return c;
  }
  errorMessage = `Error(${lineColumnNo()}) ここには文字「${c}」がこなければなりません。`;
  return null;
}

// コメントは「/*」で始まり「*/」で終るコメントのみ許可
function comment() {
  const idxBackup = idx;
  if (char('/')) {
    if (char('*')) {
      while (true) {
	const idxBackup2 = idx;
	if (char('*')) {
	  if (char('/')) {
	    return "comment";
	  }
	}
	idx = idxBackup2;
	if (inputStr.charAt(idx)==='') {
	  idx = idxBackup;
	  errorMessage = `Error(${lineColumnNo()}) ここにはコメントがこなければなりません。`;
	  return null;
	}
	idx++;
      }
    }
  }
  idx = idxBackup;
  errorMessage = `Error(${lineColumnNo()}) ここにはコメントがこなければなりません。`;
  return null;
}

// 半角空白、タブ、改行の時成功。それ以外は失敗。
function whiteChar() {
  if (char(' ')) return ' ';
  if (char('\t')) return '\t';
  if (char('\n')) return '\n';
  errorMessage = `Error(${lineColumnNo()})`;
  return null;
}

// whiteSpaceまたは空文字列を検出。なので絶対成功する。
// つまりスペースが入ってても良いし入ってなくても良い
// ような場所で使う。あとコメント文もwhiteSpace扱いに
// することにした。
function whiteSpace() {
  while (true) {
    const cmt = comment();
    if (cmt)
      continue;
    const w = whiteChar();
    if (w == null)
      return "whiteSpace";
  }
}

// 関数名、変数名などの名前に相当する識別子を検出する
function id() {
  const idxBackup = idx;
  let name = '';
  let c = inputStr.charAt(idx);
  if (!c.match(rx_id1st)) {
    errorMessage = `Error(${lineColumnNo()}) ここには識別子がくるべきです。`;
    return null;
  }
  name += c;
  while (true) {
    idx++;
    c = inputStr.charAt(idx);
    if (!c.match(rx_id2nd))
      return name;
    name += c;
  }
}

// whiteSpaceを読み飛ばして入力文字列の終りを検出する
function eof() {
  const idxBackup = idx;
  const w = whiteSpace(); // 絶対成功する
  const c = inputStr.charAt(idx); // idxが範囲外の時は空文字列
  if (c === '')
    return "EOF";
  // ここまで来たら何か文字が残ってるのでエラー
  idx = idxBackup;
  errorMessage = `Error(${lineColumnNo()}): EOF(入力の最後でなければなりません。`;
  return null;
}

// 文字列を解析する。
// まだ文字列中の引用符のエスケープとかには対応してない。
function string() {
  const idxBackup = idx;
  let a = char('"');
  if (a==null)
    a = char("'");
  if (a==null) {idx=idxBackup;return null;}
  let s = '';
  while (true) {
    const c = inputStr.charAt(idx);
    if (c === '') {
      idx = idxBackup;
      errorMessage = `Error(${lineColumnNo()}) 文字列解析中に入力が終了しました。`;
      return null;
    }
    if (c === a) {
      idx++;
      break;
    }
    s += c;
    idx++;
  }
  return s;
}

// 数字を解析する。
function number() {
  const idxBackup = idx;
  let c = inputStr.charAt(idx);
  if (c !== '.' && !c.match(rx_num)) {
    errorMessage = `Error(${lineColumnNo()}) ここには数字がこなければなりません。`;
    return null;
  }
  let num = '';
  if (c === '.') { // '.'で始まる特殊な場合
    idx++; c = inputStr.charAt(idx);
    if (!c.match(rx_num)) {
      idx = idxBackup;
      return null;
    }
    idx = idxBackup;
    c = inputStr.charAt(idx);
  } else { // ここにくるのは整数部分
    num += c;
    idx++; c = inputStr.charAt(idx);
    while (c.match(rx_num)) {
      num += c;
      idx++; c = inputStr.charAt(idx);
    }
  }
  if (c === '.') { // 小数部分
    num += c;
    idx++; c = inputStr.charAt(idx);
    while (c.match(rx_num)) {
      num += c;
      idx++; c = inputStr.charAt(idx);
    }
  }
  if (c === 'e' || c === 'E') {
    num += c;
    idx++; c = inputStr.charAt(idx);
    if (c === '+' || c === '-') {
      num += c;
      idx++; c = inputStr.charAt(idx);
    }
    while (c.match(rx_num)) {
      num += c;
      idx++; c = inputStr.charAt(idx);
    }
  }
  return Number(num);
}

// 項(条件やビルトインなど)を解析。項は関数の形をしている。
function term() {
  const idxBackup = idx;
  const fun = id();
  if (fun == null) return null;
    whiteSpace();
  if (char('(') == null) {idx=idxBackup;return null};
  const args = []; // 引数の配列
  while (true) {
    whiteSpace();
    const v = id(); if (v) {args.push(new Var(v));continue;} // 変数
    const n = number(); if (n) {args.push(n);continue;} // 数字
    const s = string(); if (s) {args.push(s);continue;} // 文字列

    break;
  }
  if (char(')') == null) {idx=idxBackup;return null};
  return new Term(fun,args);
}

// ルール1本分。Ruleのインスタンスを返す。エラーならエラーメッセージを返す。
function rule() {
  const idxBackup = idx;
  whiteSpace();
  const priority = number();
  if (priority == null) { idx=idxBackup; return null; }
  whiteSpace();
  if (char(':') == null) { idx=idxBackup; return null; }
  const lhs = [];
  while (true) {
    whiteSpace();
    const cond = term(); // 1つの条件に該当
    if (cond == null) break;
    lhs.push(cond);
  }
  if (lhs.length === 0) {
    errorMessage = `Error(${lineColumnNo()}) 条件部(LHS)がありません。`;
    idx=idxBackup;
    return null;
  }
  whiteSpace();
  if (char('-') == null) { idx=idxBackup; return null; }
  if (char('>') == null) { idx=idxBackup; return null; }
  const rhs = [];
  while (true) {
    whiteSpace();
    const com = term(); // 1つの実行命令に該当
    if (com == null) break;
    rhs.push(com);
  }
  if (rhs.length === 0) {
    errorMessage = `Error(${lineColumnNo()}) 実行部(RHS)がありません。`;
    idx=idxBackup;
    return null;
  }
  whiteSpace();
  if (char(';') == null) { idx=idxBackup; return null; }
  return new Rule(priority,lhs,rhs);
}

// ルールの集合。ここが文法解析の出発点。解析するための
// 文字列を引数で渡す。色々初期化してからスタート。
// 解析が成功したらRuleの配列を返す。そして、解析失敗の
// 時はnullではなくエラーメッセージの文字列を返す。
// 入力が空っぽの時も成功と見なして空の配列を返す。
function rules(input) {
  inputStr = input;
  idx = 0;
  errorMessage = "";

  const idxBackup = idx;
  const rs = [];
  while (true) {
    const e = eof();
    if (e)
      break; // 正常終了
    whiteSpace();
    const r = rule();
    if (r) {
      rs.push(r);
      continue;
    }
    // ここまで来たら何かエラー
    idx = idxBackup;
    return errorMessage; // rule()の時のエラーを返す
  }
  return rs;
}

export { rules };
