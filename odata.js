// Define the base OData endpoint
const baseOdataUrl = "https://services.odata.org/TripPinRESTierService/(S(cv1yysz2rbrf5cdnhz2hj2ar))/People";
let currentFilters = [];
let currentSorts = [];
let currentPage = 1;
const itemsPerPage = 5;

async function fetchOData() {
    console.log("Starting fetchOData");
    const loaderOverlay = document.getElementById("loaderOverlay"); // Changed to overlay
    if (loaderOverlay) loaderOverlay.style.display = "block"; // Show overlay
    try {
        let queryUrl = `${baseOdataUrl}?$count=true&`;
        if (currentFilters.length > 0) {
            const filterString = currentFilters
                .map(f => `${f.column} ${f.relation} '${f.value}'`)
                .join(" and ");
            queryUrl += `$filter=${encodeURIComponent(filterString)}&`;
        }
        if (currentSorts.length > 0) {
            const sortString = currentSorts
                .map(s => `${s.column} ${s.order.toLowerCase()}`)
                .join(",");
            queryUrl += `$orderby=${encodeURIComponent(sortString)}&`;
        }
        queryUrl += `$top=${itemsPerPage}&$skip=${(currentPage - 1) * itemsPerPage}`;

        console.log("Fetching URL:", queryUrl);
        let response = await fetch(queryUrl, {
            method: "GET",
            headers: { "Accept": "application/json" }
        });

        console.log("Response status:", response.status);
        if (!response.ok) throw new Error(`HTTP Error! Status: ${response.status}`);

        let data = await response.json();
        console.log("Raw response:", data);

        let users = data.value || [];
        console.log("Fetched Users:", users.length, users);

        displayUsers(users);
        const totalCount = data["@odata.count"] !== undefined ? data["@odata.count"] : users.length;
        console.log("Total count from server:", totalCount);
        updatePagination(totalCount);
    } catch (error) {
        console.error("Error fetching OData:", error);
    } finally {
        if (loaderOverlay) loaderOverlay.style.display = "none"; // Hide overlay
    }
}

function displayUsers(users) {
    const tableBody = document.getElementById("userTableBody");
    if (!tableBody) return console.error("Table body not found!");

    while (tableBody.firstChild) tableBody.removeChild(tableBody.firstChild);

    users.forEach(user => {
        const row = document.createElement("tr");
        const properties = [
            user.UserName || "N/A",
            user.FirstName || "N/A",
            user.LastName || "N/A",
            user.MiddleName || "N/A",
            user.Gender || "N/A",
            user.Age || "N/A"
        ];
        properties.forEach(value => {
            const cell = document.createElement("td");
            cell.style.padding = '10px 0';
            cell.textContent = value;
            row.appendChild(cell);
        });
        tableBody.appendChild(row);
    });
}

function toggleFilterPopup() {
    const filterOverlay = document.getElementById("filterOverlay"); // Changed to overlay
    console.log("Toggling filter popup, current display:", filterOverlay.style.display);
    filterOverlay.style.display = filterOverlay.style.display === "none" || !filterOverlay.style.display ? "block" : "none";
}

function toggleSortPopup() {
    const sortOverlay = document.getElementById("sortOverlay"); // Changed to overlay
    console.log("Toggling sort popup, current display:", sortOverlay.style.display);
    sortOverlay.style.display = sortOverlay.style.display === "none" || !sortOverlay.style.display ? "block" : "none";
}

function closeFilterPopup() {
    const filterOverlay = document.getElementById("filterOverlay"); // Changed to overlay
    if (filterOverlay) filterOverlay.style.display = "none";
}

function closeSortPopup() {
    const sortOverlay = document.getElementById("sortOverlay"); // Changed to overlay
    if (sortOverlay) sortOverlay.style.display = "none";
}

function addFilterRow() {
    const container = document.getElementById("filter-rows-container");
    const filterCount = document.getElementById("filter-count");

    if (container.children.length === 0) {
        const header = document.createElement("div");
        header.className = "filter-row filter-header";
        const labels = ["Column", "Relation", "Filter Value"];
        labels.forEach(labelText => {
            const span = document.createElement("span");
            span.textContent = labelText;
            header.appendChild(span);
        });
        container.appendChild(header);
    }

    const filterRow = document.createElement("div");
    filterRow.className = "filter-row";

    const columnSelect = document.createElement("select");
    columnSelect.className = "filter-column";
    const columnOptions = [
        { value: "UserName", text: "User Name" },
        { value: "FirstName", text: "First Name" },
        { value: "LastName", text: "Last Name" },
        { value: "Gender", text: "Gender" }
    ];
    columnOptions.forEach(opt => {
        const option = document.createElement("option");
        option.value = opt.value;
        option.textContent = opt.text;
        columnSelect.appendChild(option);
    });

    const relationSelect = document.createElement("select");
    relationSelect.className = "filter-relation";
    const relationOptions = [
        { value: "eq", text: "Equal" },
        { value: "gt", text: "Greater Than" },
        { value: "lt", text: "Less Than" }
    ];
    relationOptions.forEach(opt => {
        const option = document.createElement("option");
        option.value = opt.value;
        option.textContent = opt.text;
        relationSelect.appendChild(option);
    });

    const valueInput = document.createElement("input");
    valueInput.type = "text";
    valueInput.className = "filter-value";
    valueInput.placeholder = "Enter value";

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "filter-delete-btn";
    const deleteImg = document.createElement("img");
    deleteImg.src = "Project-Icons/trash-can-outline.png";
    deleteImg.alt = "Delete";
    deleteImg.width = 24;
    deleteImg.height = 24;
    deleteBtn.appendChild(deleteImg);

    filterRow.appendChild(columnSelect);
    filterRow.appendChild(relationSelect);
    filterRow.appendChild(valueInput);
    filterRow.appendChild(deleteBtn);
    container.appendChild(filterRow);

    filterCount.textContent = parseInt(filterCount.textContent) + 1;

    deleteBtn.addEventListener("click", () => {
        filterRow.remove();
        filterCount.textContent = Math.max(0, parseInt(filterCount.textContent) - 1);
        updateFilters();
    });

    [columnSelect, relationSelect, valueInput].forEach(input => {
        input.addEventListener("change", updateFilters);
    });
}

function addSortRow() {
    const container = document.getElementById("sorter-container");
    const sortCount = document.getElementById("sort-count");

    if (container.children.length === 0) {
        const header = document.createElement("div");
        header.className = "sort-row sort-header";
        const labels = ["Column", "Order"];
        labels.forEach(labelText => {
            const span = document.createElement("span");
            span.textContent = labelText;
            header.appendChild(span);
        });
        container.appendChild(header);
    }

    const sortRow = document.createElement("div");
    sortRow.className = "sort-row";

    const columnSelect = document.createElement("select");
    columnSelect.className = "sort-column";
    const columnOptions = [
        { value: "UserName", text: "User Name" },
        { value: "FirstName", text: "First Name" },
        { value: "LastName", text: "Last Name" },
        { value: "MiddleName", text: "Middle Name" },
        { value: "Gender", text: "Gender" },
        { value: "Age", text: "Age" }
    ];
    columnOptions.forEach(opt => {
        const option = document.createElement("option");
        option.value = opt.value;
        option.textContent = opt.text;
        columnSelect.appendChild(option);
    });

    const orderSelect = document.createElement("select");
    orderSelect.className = "sort-order";
    const orderOptions = [
        { value: "Asc", text: "Ascending" },
        { value: "Desc", text: "Descending" }
    ];
    orderOptions.forEach(opt => {
        const option = document.createElement("option");
        option.value = opt.value;
        option.textContent = opt.text;
        orderSelect.appendChild(option);
    });

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "sort-delete-btn";
    const deleteImg = document.createElement("img");
    deleteImg.src = "Project-Icons/trash-can-outline.png";
    deleteImg.alt = "Delete";
    deleteImg.width = 24;
    deleteImg.height = 24;
    deleteBtn.appendChild(deleteImg);

    sortRow.appendChild(columnSelect);
    sortRow.appendChild(orderSelect);
    sortRow.appendChild(deleteBtn);
    container.appendChild(sortRow);

    sortCount.textContent = parseInt(sortCount.textContent) + 1;

    deleteBtn.addEventListener("click", () => {
        sortRow.remove();
        sortCount.textContent = Math.max(0, parseInt(sortCount.textContent) - 1);
        updateSorts();
    });

    [columnSelect, orderSelect].forEach(input => {
        input.addEventListener("change", updateSorts);
    });
}

function updateFilters() {
    const rows = document.querySelectorAll(".filter-row:not(.filter-header)");
    currentFilters = Array.from(rows).map(row => ({
        column: row.querySelector(".filter-column").value,
        relation: row.querySelector(".filter-relation").value,
        value: row.querySelector(".filter-value").value
    }));
}

function updateSorts() {
    const rows = document.querySelectorAll(".sort-row:not(.sort-header)");
    currentSorts = Array.from(rows).map(row => ({
        column: row.querySelector(".sort-column").value,
        order: row.querySelector(".sort-order").value
    }));
}

function removeFilter() {
    const container = document.getElementById("filter-rows-container");
    const filterCount = document.getElementById("filter-count");
    if (!container || !filterCount) {
        console.error("Filter container or count element not found!");
        return;
    }
    while (container.firstChild) container.removeChild(container.firstChild);
    filterCount.textContent = "0";
    currentFilters = [];
    fetchOData();
}

function removeSort() {
    const container = document.getElementById("sorter-container");
    const sortCount = document.getElementById("sort-count");
    if (!container || !sortCount) {
        console.error("Sort container or count element not found!");
        return;
    }
    console.log("Removing sort criteria");
    while (container.firstChild) container.removeChild(container.firstChild);
    sortCount.textContent = "0";
    currentSorts = [];
    fetchOData();
}

function resetFilterPopup() {
    removeFilter();
}

function resetSortPopup() {
    removeSort();
}

function refreshTickets() {
    currentPage = 1;
    fetchOData();
}

function submitFilters() {
    updateFilters();
    fetchOData();
    closeFilterPopup();
}

function submitSorts() {
    updateSorts();
    fetchOData();
    closeSortPopup();
}

function updatePagination(totalItems) {
    const pageNumbers = document.getElementById("page-numbers");
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    pageNumbers.textContent = `Page ${currentPage} of ${totalPages}`;

    const prevLink = document.getElementById("prev");
    const nextLink = document.getElementById("next");
    prevLink.style.display = currentPage === 1 ? "none" : "inline";
    nextLink.style.display = currentPage >= totalPages ? "none" : "inline";

    document.querySelectorAll(".page-link").forEach(link => {
        const pageNum = parseInt(link.dataset.page);
        link.classList.toggle("active", pageNum === currentPage);
        link.style.display = pageNum <= totalPages ? "inline" : "none";
    });
}

document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM loaded, fetching data...");
    fetchOData();

    const filterLink = document.getElementById("filter-id");
    if (filterLink) {
        filterLink.addEventListener("click", (e) => {
            e.preventDefault();
            console.log("Filter link clicked");
            toggleFilterPopup();
        });
    } else {
        console.error("Filter link (#filter-id) not found!");
    }

    const sortLink = document.getElementById("sort-id");
    if (sortLink) {
        sortLink.addEventListener("click", (e) => {
            e.preventDefault();
            console.log("Sort link clicked");
            toggleSortPopup();
        });
    } else {
        console.error("Sort link (#sort-id) not found!");
    }

    const addFilterBtn = document.querySelector(".filter-add-btn");
    if (addFilterBtn) addFilterBtn.addEventListener("click", addFilterRow);

    const addSortBtn = document.querySelector(".add-sorter");
    if (addSortBtn) addSortBtn.addEventListener("click", addSortRow);

    const closeFilterBtn = document.querySelector(".filter-close-btn");
    if (closeFilterBtn) closeFilterBtn.addEventListener("click", closeFilterPopup);

    const closeSortBtn = document.querySelector(".close-icon");
    if (closeSortBtn) closeSortBtn.addEventListener("click", closeSortPopup);

    const submitFilterBtn = document.querySelector(".filter-submit-btn");
    if (submitFilterBtn) submitFilterBtn.addEventListener("click", submitFilters);

    const submitSortBtn = document.querySelector(".sort-submit-btn");
    if (submitSortBtn) submitSortBtn.addEventListener("click", submitSorts);

    const resetFilterBtn = document.querySelector(".filter-reset-btn");
    if (resetFilterBtn) {
        resetFilterBtn.addEventListener("click", () => {
            console.log("Reset filter clicked");
            resetFilterPopup();
        });
    }

    const resetSortBtn = document.querySelector(".sort-reset-btn");
    if (resetSortBtn) {
        resetSortBtn.addEventListener("click", () => {
            console.log("Reset sort clicked");
            resetSortPopup();
        });
    }

    const removeFilterBtn = document.querySelector("#filter .close-btn");
    if (removeFilterBtn) removeFilterBtn.addEventListener("click", removeFilter);

    const removeSortBtn = document.querySelector("#sort .close-btn");
    if (removeSortBtn) {
        removeSortBtn.addEventListener("click", () => {
            console.log("Sort close button clicked");
            removeSort();
        });
    } else {
        console.error("Sort close button (#sort .close-btn) not found!");
    }

    const refreshBtn = document.querySelector(".refreshbutton");
    if (refreshBtn) refreshBtn.addEventListener("click", refreshTickets);

    const prevLink = document.getElementById("prev");
    if (prevLink) {
        prevLink.addEventListener("click", (e) => {
            e.preventDefault();
            if (currentPage > 1) {
                currentPage--;
                fetchOData();
            }
        });
    }

    const nextLink = document.getElementById("next");
    if (nextLink) {
        nextLink.addEventListener("click", (e) => {
            e.preventDefault();
            currentPage++;
            fetchOData();
        });
    }

    document.querySelectorAll(".page-link").forEach(link => {
        link.addEventListener("click", (e) => {
            e.preventDefault();
            currentPage = parseInt(link.dataset.page);
            fetchOData();
        });
    });
});