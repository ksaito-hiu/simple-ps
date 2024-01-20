!function(t,e){"object"==typeof exports&&"object"==typeof module?module.exports=e():"function"==typeof define&&define.amd?define([],e):"object"==typeof exports?exports.SimplePS=e():t.SimplePS=e()}(self,(()=>(()=>{"use strict";var t={d:(e,s)=>{for(var r in s)t.o(s,r)&&!t.o(e,r)&&Object.defineProperty(e,r,{enumerable:!0,get:s[r]})},o:(t,e)=>Object.prototype.hasOwnProperty.call(t,e),r:t=>{"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(t,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(t,"__esModule",{value:!0})}},e={};t.r(e),t.d(e,{BuiltIn:()=>v,Engine:()=>y});const s=new RegExp("[a-zA-Z_À-῿぀-㆏㐀-㴭一-鿿豈-﫿]"),r=new RegExp("[a-zA-Z_À-῿぀-㆏㐀-㴭一-鿿豈-﫿0-9]"),n=new RegExp("[0-9]");let i,o,u;function h(){let t=1,e=1;for(let s=0;s<o;s++)"\n"===i.charAt(s)?(t++,e=1):e++;return t+":"+e}function c(t){return i.charAt(o)===t?(o++,t):(u=`Error(${h()}) ここには文字「${t}」がこなければなりません。`,null)}function a(){const t=o;if(c("/")&&c("*"))for(;;){const e=o;if(c("*")&&c("/"))return"comment";if(o=e,""===i.charAt(o))return o=t,u=`Error(${h()}) ここにはコメントがこなければなりません。`,null;o++}return o=t,u=`Error(${h()}) ここにはコメントがこなければなりません。`,null}function l(){for(;;)if(!a()&&null==(c(" ")?" ":c("\t")?"\t":c("\n")?"\n":(u=`Error(${h()})`,null)))return"whiteSpace"}function g(){let t="",e=i.charAt(o);if(!e.match(s))return u=`Error(${h()}) ここには識別子がくるべきです。`,null;for(t+=e;;){if(o++,e=i.charAt(o),!e.match(r))return t;t+=e}}function m(){const t=o;return l(),""===i.charAt(o)?"EOF":(o=t,u=`Error(${h()}): EOF(入力の最後でなければなりません。`,null)}function d(){const t=o;let e=c('"');if(null==e&&(e=c("'")),null==e)return o=t,null;let s="";for(;;){const r=i.charAt(o);if(""===r)return o=t,u=`Error(${h()}) 文字列解析中に入力が終了しました。`,null;if(r===e){o++;break}s+=r,o++}return s}function A(){const t=o;let e=i.charAt(o);if("."!==e&&!e.match(n))return u=`Error(${h()}) ここには数字がこなければなりません。`,null;let s="";if("."===e){if(o++,e=i.charAt(o),!e.match(n))return o=t,null;o=t,e=i.charAt(o)}else for(s+=e,o++,e=i.charAt(o);e.match(n);)s+=e,o++,e=i.charAt(o);if("."===e)for(s+=e,o++,e=i.charAt(o);e.match(n);)s+=e,o++,e=i.charAt(o);if("e"===e||"E"===e)for(s+=e,o++,e=i.charAt(o),"+"!==e&&"-"!==e||(s+=e,o++,e=i.charAt(o));e.match(n);)s+=e,o++,e=i.charAt(o);return Number(s)}function f(){const t=o,e=g();if(null==e)return null;if(l(),null==c("("))return o=t,null;const s=[];for(;;){l(),","===i.charAt(o)&&o++,l();const t=g();if(t){s.push(new w(t));continue}const e=A();if(e){s.push(e);continue}const r=d();if(!r)break;s.push(r)}return l(),null==c(")")?(o=t,null):(l(),","===i.charAt(o)&&o++,new I(e,s))}function p(){const t=o;l();const e=A();if(null==e)return o=t,null;if(l(),null==c(":"))return o=t,null;const s=[];for(;;){l();const t=f();if(null==t)break;s.push(t)}if(0===s.length)return u=`Error(${h()}) 条件部(LHS)がありません。`,o=t,null;if(l(),null==c(">"))return o=t,null;const r=[];for(;;){l();const t=f();if(null==t)break;r.push(t)}return 0===r.length?(u=`Error(${h()}) 実行部(RHS)がありません。`,o=t,null):(l(),null==c(";")?(o=t,null):new N(e,s,r))}class w{name;constructor(t){this.name=t}}class I{name;args;constructor(t,e){this.name=t,this.args=e}toString(){let t="";return t+=this.name+"(",this.args.forEach((e=>{"number"==typeof e?t+=e+" ":"string"==typeof e?t+='"'+e+'" ':"Var"===e.constructor.name?t+=e.name+" ":t+="??? "})),t+=")",t}newestTime(t){let e=0;return this.args.forEach((s=>{if("Var"===s.constructor){const r=t.getInfoUpdateTime(s.name);e<r&&(e=r)}})),e}}class N{engine;priority;lhs;rhs;env;updateTime;constructor(t,e,s){this.priority=t,this.lhs=e,this.rhs=s,this.updateTime=-1}toString(){let t="";return t+=this.priority+": ",this.lhs.forEach((e=>{t+=e.toString()+" "})),t+="> ",this.rhs.forEach((e=>{t+=e.toString()+" "})),t+=";",t}checkConditions(){this.env={};let t=-1;for(let e=0;e<this.lhs.length;e++){const s=this.lhs[e],r=this.engine.builtIns[s.name];if(!r)return console.log(`${s.name}という名前のビルトインが見付かりません。`),!1;try{if(!r.preEval(s.args,this.env))return!1;const e=s.newestTime(this.engine);e>t&&(t=e)}catch(t){return console.log(t),!1}}return!(t<=this.updateTime)}doActions(){this.updateTime=this.engine.timeCounter,this.rhs.forEach((t=>{const e=this.engine.builtIns[t.name];if(e)try{e.preEval(t.args,this.env)}catch(t){return void console.log(t)}else console.log(`${t.name}という名前のビルトインが見付かりません。`)}))}}class v{name;engine;args;env;constructor(t){this.name=t}preEval(t,e){return this.args=t,this.env=e,this.eval()}eval(){}getArgsNum(){return this.args.length}checkArgsNum(t){if(this.args.length!=t)throw new Error(`${this.name}(${this.constructor.name}) 必ず${t}の引数を指定して下さい。`)}getArgAsName(t){if("Var"!=this.args[t].constructor.name)throw new Error(`${this.name}(${this.constructor.name}) ${t+1}番目の引数は変数でなければなりません。`);return this.args[t].name}getArgAsNum(t){if("number"==typeof this.args[t])return this.args[t];if("Var"==this.args[t].constructor.name){const e=this.env[this.args[t].name];if("number"==typeof e)return e;throw new Error(`${this.name}(${this.constructor.name}) ${t+1}番目の引数の変数は空でした。`)}throw new Error(`${this.name}(${this.constructor.name}) ${t+1}番目の引数は数値でなければなりません。`)}getArgAsStr(t){if("string"==typeof this.args[t])return this.args[t];if("Var"==this.args[t].constructor.name){const e=this.env[this.args[t].name];if("string"==typeof e)return e;throw new Error(`${this.name}(${this.constructor.name}) ${t+1}番目の引数の変数は空でした。`)}throw new Error(`${this.name}(${this.constructor.name}) ${t+1}番目の引数は文字列でなければなりません。`)}getArgIfNotEmpty(t){if("number"==typeof this.args[t])return this.args[t];if("string"==typeof this.args[t])return this.args[t];if("Var"==this.args[t].constructor.name){const e=this.env[this.args[t].name];if("number"==typeof e)return e;if("string"==typeof e)return e;throw new Error(`${this.name}(${this.constructor.name}) ${t+1}番目の引数の変数は空でした。`)}throw new Error(`${this.name}(${this.constructor.name}) ${t+1}番目の引数は不明な値です。`)}getArg(t){if("number"==typeof this.args[t])return this.args[t];if("string"==typeof this.args[t])return this.args[t];if("Var"===this.args[t].constructor.name)return this.env[this.args[t].name];throw new Error(`${this.name}(${this.constructor.name}) ${t+1}番目の引数の変数は空でした。`)}setVar(t,e){this.env[t]=e}getVar(t){return this.env[t]}setInfoToWM(t,e){this.engine.setInfoToWM(t,e)}getInfoFromWM(t){return this.engine.getInfoFromWM(t)}delInfoFromWM(t){this.engine.delInfoFromWM(t)}}class y{rules;builtIns;workingMemory;stopRequest;timeCounter;timeoutID;constructor(t){this.rules=void 0===t?[]:function(t){i=t,o=0,u="";const e=function(){const t=o,e=[];for(;!m();){l();const s=p();if(!s)return o=t,null;e.push(s)}return e}();return null===e?u:e}(t),this.rules.forEach((t=>{t.engine=this})),this.builtIns={},this.workingMemory={},this.stopRequest=!0,this.timeCounter=0,this.timeoutID=0,this.addBuiltIn(new $),this.addBuiltIn(new E),this.addBuiltIn(new k),this.addBuiltIn(new x),this.addBuiltIn(new B),this.addBuiltIn(new M),this.addBuiltIn(new b),this.addBuiltIn(new S),this.addBuiltIn(new T),this.addBuiltIn(new V),this.addBuiltIn(new W),this.addBuiltIn(new F),this.addBuiltIn(new R),this.addBuiltIn(new D),this.addBuiltIn(new q),this.addBuiltIn(new j),this.addBuiltIn(new O),this.addBuiltIn(new C),this.addBuiltIn(new P),this.addBuiltIn(new L),this.addBuiltIn(new _),this.addBuiltIn(new z),this.addBuiltIn(new H),this.addBuiltIn(new U),this.addBuiltIn(new Z),this.addBuiltIn(new G),this.addBuiltIn(new J),this.addBuiltIn(new K),this.addBuiltIn(new Q),this.addBuiltIn(new X),this.addBuiltIn(new Y)}addBuiltIn(t){t.engine=this,this.builtIns[t.name]=t}setInfoToWM(t,e){void 0===e&&(e=null),this.timeCounter++,this.workingMemory[t]={updateTime:this.timeCounter,value:e},!1===this.stopRequest&&0===this.timeoutID&&this.start()}getInfoFromWM(t){const e=this.workingMemory[t];if(e)return e.value}delInfoFromWM(t){delete this.workingMemory[t]}getInfoUpdateTime(t){const e=this.workingMemory[t];if(e)return e.updateTime}dumpWM(){let t="";return Object.keys(this.workingMemory).forEach((e=>{t+=e+":",t+=this.workingMemory[e].value+" "})),t}start(){this.stopRequest=!1,this.timeoutID=setTimeout((()=>{this.inferLoop()}),0)}inferLoop(){this.timeoutID=-1;const t=[];this.rules.forEach((e=>{e.checkConditions(this.workingMemory)&&t.push(e)}));let e=-1,s=null;t.forEach((t=>{e<t.priority&&(s=t,e=t.priority)})),null!==s?(s.doActions(),!1===this.stopRequest?this.timeoutID=setTimeout((()=>{this.inferLoop()}),0):this.timeoutID=0):this.timeoutID=0}stop(){this.stopRequest=!0,clearTimeout(this.timeoutID),this.timeoutID=0}}class $ extends v{constructor(){super("s")}eval(){this.checkArgsNum(1);const t=this.getArgAsName(0),e=this.getInfoFromWM(t);return void 0!==e&&(this.setVar(t,e),!0)}}class E extends v{constructor(){super("no")}eval(){this.checkArgsNum(1);const t=this.getArgAsName(0);return void 0===this.getInfoFromWM(t)}}class k extends v{constructor(){super("gt")}eval(){return this.checkArgsNum(2),this.getArgAsNum(0)>this.getArgAsNum(1)}}class x extends v{constructor(){super("lt")}eval(){return this.checkArgsNum(2),this.getArgAsNum(0)<this.getArgAsNum(1)}}class B extends v{constructor(){super("ge")}eval(){return this.checkArgsNum(2),this.getArgAsNum(0)>=this.getArgAsNum(1)}}class M extends v{constructor(){super("le")}eval(){return this.checkArgsNum(2),this.getArgAsNum(0)<=this.getArgAsNum(1)}}class b extends v{constructor(){super("eq")}eval(){return this.checkArgsNum(2),this.getArgIfNotEmpty(0)===this.getArgIfNotEmpty(1)}}class S extends v{constructor(){super("neq")}eval(){return this.checkArgsNum(2),this.getArgIfNotEmpty(0)!==this.getArgIfNotEmpty(1)}}class T extends v{constructor(){super("range")}eval(){this.checkArgsNum(3);const t=this.getArgAsNum(0),e=this.getArgAsNum(1);if(e>this.getArgAsNum(2))throw new Error("range(RangeBI) (第2引数 <= 第3引数) でなければなりません。");return!(e>=t||d2<=d3)}}class V extends v{constructor(){super("range2")}eval(){this.checkArgsNum(3);const t=this.getArgAsNum(0),e=this.getArgAsNum(1);if(e>=this.getArgAsNum(2))throw new Error("range(RangeBI) 第2引数 < 第3引数 でなければなりません。");return!(e>t||d2<d3)}}class W extends v{constructor(){super("seq")}eval(){this.checkArgsNum(2);const t=this.getArgAsName(0),e=this.getInfoFromWM(t);return void 0!==e&&(this.setVar(t,e),e===this.getArg(1))}}class F extends v{constructor(){super("sgt")}eval(){console.log(`${this.name}(${this.constructor.name}) is not implemented yet!`)}}class R extends v{constructor(){super("slt")}eval(){console.log(`${this.name}(${this.constructor.name}) is not implemented yet!`)}}class D extends v{constructor(){super("sge")}eval(){console.log(`${this.name}(${this.constructor.name}) is not implemented yet!`)}}class q extends v{constructor(){super("sle")}eval(){console.log(`${this.name}(${this.constructor.name}) is not implemented yet!`)}}class j extends v{constructor(){super("set")}eval(){console.log(`${this.name}(${this.constructor.name}) is not implemented yet!`)}}class O extends v{constructor(){super("st")}eval(){this.checkArgsNum(1);const t=this.getArgAsName(0),e=this.getVar(t);return this.setInfoToWM(t,e),!0}}class C extends v{constructor(){super("st2")}eval(){this.checkArgsNum(2);const t=this.getArgAsName(0),e=this.getArg(1);this.setInfoToWM(t,e)}}class P extends v{constructor(){super("del")}eval(){this.checkArgsNum(1);const t=this.getArgAsName(0);this.delInfoFromWM(t)}}class L extends v{constructor(){super("add")}eval(){this.checkArgsNum(3);const t=this.getArgAsNum(0),e=this.getArgAsNum(1),s=this.getArgAsName(2);this.setVar(s,t+e)}}class _ extends v{constructor(){super("sub")}eval(){this.checkArgsNum(3);const t=this.getArgAsNum(0),e=this.getArgAsNum(1),s=this.getArgAsName(2);this.setVar(s,t-e)}}class z extends v{constructor(){super("mul")}eval(){this.checkArgsNum(3);const t=this.getArgAsNum(0),e=this.getArgAsNum(1),s=this.getArgAsName(2);this.setVar(s,t*e)}}class H extends v{constructor(){super("div")}eval(){this.checkArgsNum(3);const t=this.getArgAsNum(0),e=this.getArgAsNum(1),s=this.getArgAsName(2);if(0===e)throw new Error("div(DivBI) 割る数が0です。");this.setVar(s,t/e)}}class U extends v{constructor(){super("concat")}eval(){this.checkArgsNum(3);const t=this.getArgAsStr(0),e=this.getArgAsStr(1),s=this.getArgAsName(2);this.setVar(s,t+e)}}class Z extends v{constructor(){super("log")}eval(){let t="";const e=this.getArgsNum();for(let s=0;s<e;s++)t+=this.getArg(s);console.log(t)}}class G extends v{constructor(){super("rand")}eval(){this.checkArgsNum(1);const t=this.getArgAsName(0);this.setVar(t,Math.random())}}class J extends v{constructor(){super("mod")}eval(){this.checkArgsNum(3);const t=this.getArgAsNum(0),e=this.getArgAsNum(1),s=this.getArgAsName(2);if(0===e)throw new Error("mod(ModBI) 割る数が0です。");const r=t/e,n=t-e*Math.floor(r);this.setVar(s,n)}}class K extends v{constructor(){super("floor")}eval(){this.checkArgsNum(2);const t=this.getArgAsNum(0),e=this.getArgAsName(1);this.setVar(e,Math.floor(t))}}class Q extends v{constructor(){super("sneq")}eval(){console.log(`${this.name}(${this.constructor.name}) is not implemented yet!`)}}class X extends v{constructor(){super("stop")}eval(){this.engine.stop(),console.log("stop(StopBI) 推論エンジンを停止させます。")}}class Y extends v{constructor(){super("wm")}eval(){const t=this.engine.dumpWM();console.log(t)}}return e})()));