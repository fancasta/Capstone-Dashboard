import {readRoute, urlFor} from "./disclosureNavigation";
import {sourcePageUrl} from "./sourcePageUrl";

const swire = {publisher:"Swire Pacific", sector:"Diversified", url:"https://raw.githubusercontent.com/fancasta/climate-disclosure-explorer/main/test.pdf"};
const catalog = {reports:[swire], topics:[{name:"Renewable electricity"}]};
const path = "/climate-disclosure-explorer/";

test("an old notebook link keeps the actual topic and sector when it becomes a results link", () => {
  window.history.replaceState({}, "", path+"?topic=Renewable+electricity&sector=Diversified&view=notes");
  const route = readRoute(catalog);
  expect(route.explore).toBe(true);
  const canonical = new URL(urlFor(route), window.location.origin);
  expect(canonical.searchParams.get("topic")).toBe("Renewable electricity");
  expect(canonical.searchParams.get("sector")).toBe("Diversified");
  expect(canonical.searchParams.has("view")).toBe(false);
});

test("the project home and unfiltered directory are distinct shareable destinations", () => {
  window.history.replaceState({}, "", path);
  expect(readRoute(catalog).explore).toBe(false);
  window.history.replaceState({}, "", urlFor({explore:true}));
  expect(readRoute(catalog).explore).toBe(true);
});

test("archived citations preserve company, physical page, and returning search scope", () => {
  window.history.replaceState({}, "", path+"?topic=Renewable+electricity&sector=Diversified");
  const source = new URL(sourcePageUrl(swire,24), window.location.origin);
  expect(source.pathname).toMatch(/source\.html$/);
  expect(Object.fromEntries(source.searchParams)).toEqual({
    report:"Swire Pacific",page:"24",topic:"Renewable electricity",sector:"Diversified"
  });
  expect(sourcePageUrl({url:"https://www.oracle.com/report.pdf"},37)).toBe("https://www.oracle.com/report.pdf#page=37");
});
