package data

type ShopsJsonItem struct {
	Name string `json:"name"`
	Ids  []int  `json:"ids"`
}

type ShopsJsonShop struct {
	Id          string          `json:"id"`
	DisplayName string          `json:"displayName"`
	Link        string          `json:"link"`
	ReportDate  string          `json:"reportDate"`
	Items       []ShopsJsonItem `json:"items"`
}

type ShopsJson []*ShopsJsonShop
