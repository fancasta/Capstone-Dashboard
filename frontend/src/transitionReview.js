// Physical PDF pages in Shell's Annual Report and Accounts 2021.
export const transitionReview = {
  publisher: "Shell",
  title: "Annual Report and Accounts 2021",
  question: "How much of the decline came from changes at sites Shell kept operating?",
  evidence: [
    {
      page: 92,
      label: "Check the target",
      summary: "Alongside its 2050 pledge, Shell set a 2030 target to halve net emissions from its operations and purchased energy, measured against 2016.",
      excerpt: "under our operational control (including divestments) by 50% by 2030",
      note: "Shell’s 2030 target covered absolute Scope 1 and 2 emissions on a net basis. These cover its own operations and the energy it buys to run them. The 2016 baseline and the inclusion of asset sales matter when comparing progress. Its broader 2050 pledge also covered emissions from customers using its products."
    },
    {
      page: 95,
      label: "Check reported progress",
      summary: "Shell reported 68 million tonnes of CO₂e from those sources in 2021, down from 71 million in 2020. It cited asset sales among the reasons.",
      excerpt: "divestments in 2020 and 2021",
      note: "The chart shows combined Scope 1 and 2 emissions falling from 71 million tonnes of CO₂e in 2020 to 68 million in 2021. Shell lists refinery sales, shutdowns and emissions-reduction work among the reasons its direct emissions fell. The chart groups divestments with other factors, so it gives no separate figure for asset sales alone."
    }
  ]
};

export function reviewPage(page) {
  return { explore: true, publisher: transitionReview.publisher, page };
}
