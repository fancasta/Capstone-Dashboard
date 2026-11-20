import PublishedExamples from "./components/PublishedExamples";
import "./pages/explorer.css";
import "./public-demo.css";

export default function PublicDemo() {
  return <main className="climate-shell public-demo">
    <header className="climate-head">
      <h1>Climate disclosure explorer</h1>
      <p>Choose a publisher and a question to trace an energy claim to the page that supports it.</p>
    </header>
    <PublishedExamples />
    <footer><a href="https://github.com/fancasta/climate-disclosure-explorer/blob/main/CASE_STUDIES.md">Explore the methods and results</a>
      <a href="https://github.com/fancasta/Capstone-Dashboard">View dashboard code</a></footer>
  </main>;
}
