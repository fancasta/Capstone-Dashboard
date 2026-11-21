import {search} from "./corpusSearch";

const catalog={reports:[{publisher:"A",sector:"Utilities"},{publisher:"B",sector:"Technology"}],
  topics:[{phrases:["human rights"]}],stop:["the","of"],pages:[[0,1,10,[0]],[1,3,20,[]],[1,5,15,[0]]]};
const index={human:btoa(String.fromCharCode(0,3,1,1,1,2)),rights:btoa(String.fromCharCode(0,2,2,1)),water:btoa(String.fromCharCode(1,1))};
const ids=(...args)=>search(catalog,index,...args).map(h=>h.id);
test("all significant tokens must occur on the same page and results are ranked",()=>{
  expect(ids("the human rights",-1,"","")).toEqual([0,2]);
  expect(ids("rights water",-1,"","")).toEqual([]);
  expect(ids("constructor",-1,"","")).toEqual([]);
  expect(ids("the of",-1,"","")).toEqual([]);
});
test("guided searches use known phrase labels and filters preserve an empty set",()=>{
  expect(ids("",0,"B","Technology")).toEqual([2]);
  expect(ids("",0,"A","Technology")).toEqual([]);
  expect(ids("",-1,"","")).toEqual([0,1,2]);
});
