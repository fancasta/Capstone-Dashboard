import React, {useState} from 'react'

export default function CompSearchBar({companyData, handleCompanySelect}) {
    const [searchInput, setSearchInput] = useState("");
    var companies = companyData;

    const handleChange = (event) => {
        event.preventDefault();
        setSearchInput(event.target.value);
        handleCompanySelect(searchInput)
    };

    
    var valid_companies = []
    if (searchInput.length > 0) {
        valid_companies = companies.filter((company) => {
            return company.companyName.match(searchInput);
        });
    }

    return (
        <div>
        <div>
        <input
            type="search"
            placeholder="Search here"
            onChange={handleChange}
            value={searchInput} />
        </div>

        <div>
        <label>Pick Company:</label>
        <select onSelect={handleChange}>
        {valid_companies.map((item, index) => (
            <option value={item.companyName}>{item.companyName}</option>
        ))}
        </select>
        </div>
        </div>
        
    );
}
