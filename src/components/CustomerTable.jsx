import React, { useEffect, useMemo, useRef, useState } from "react";
import searchIcon from "../assets/test-search.svg";
import {
  generatePage,
  generateRecord,
  TOTAL_RECORDS,
} from "../utils/generateData.js";
import useDebounce from "../hooks/useDebounce.js";
import filterIcon from "../assets/test-filter.svg";

const PAGE_SIZE = 30;
const SCAN_CHUNK = 10000; // search scanning chunk size to keep UI responsive

export default function CustomerTable() {
  const [pages, setPages] = useState([]); // array of pageIndex (0-based) loaded
  const [rows, setRows] = useState([]); // flattened rows loaded so far
  const [pageIndex, setPageIndex] = useState(0);
  const [loadingPage, setLoadingPage] = useState(false);

  // search + filtered result state
  const [query, setQuery] = useState("");
  const debQuery = useDebounce(query, 250);
  const [isSearching, setIsSearching] = useState(false);
  const [searchProgress, setSearchProgress] = useState(0);
  const [searchResults, setSearchResults] = useState(null); // null means no active search

  // sorting
  const [sortKey, setSortKey] = useState(null); // e.g. 'name'
  const [sortDir, setSortDir] = useState("asc"); // 'asc'|'desc'

  const containerRef = useRef();

  // initial load
  useEffect(() => {
    loadNextPage(); // load first page
    // eslint-disable-next-line
  }, []);

  function loadNextPage() {
    if (loadingPage) return;
    setLoadingPage(true);
    const idx = pageIndex;
    // small timeout to avoid blocking paint
    setTimeout(() => {
      const pg = generatePage(idx, PAGE_SIZE);
      setPages((prev) => [...prev, idx]);
      setRows((prev) => [...prev, ...pg]);
      setPageIndex((prev) => prev + 1);
      setLoadingPage(false);
    }, 0);
  }

  // infinite scroll handler
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    function onScroll() {
      const bottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 200;
      if (bottom && !loadingPage && !isSearching) {
        // load next page (unless all loaded)
        const maxPages = Math.ceil(TOTAL_RECORDS / PAGE_SIZE);
        if (pageIndex < maxPages) loadNextPage();
      }
    }
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, [loadingPage, pageIndex, isSearching]);

  // sorting logic (applies to visible dataset: either rows loaded OR searchResults)
  const displayedRows = useMemo(() => {
    const source = searchResults !== null ? searchResults : rows;
    if (!sortKey) return source;
    const sorted = [...source].sort((a, b) => {
      let av = a[sortKey],
        bv = b[sortKey];
      if (typeof av === "string") av = av.toLowerCase();
      if (typeof bv === "string") bv = bv.toLowerCase();
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [rows, searchResults, sortKey, sortDir]);

  function toggleSort(col) {
    if (sortKey === col) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(col);
      setSortDir("asc");
    }
  }

  // Async non-blocking scan over the whole dataset for search
  useEffect(() => {
    let cancelled = false;
    async function runSearch(q) {
      if (!q) {
        setSearchResults(null);
        setIsSearching(false);
        setSearchProgress(0);
        return;
      }
      setIsSearching(true);
      setSearchProgress(0);
      const qL = q.toLowerCase();
      const matches = [];
      const total = TOTAL_RECORDS;
      for (let start = 0; start < total; start += SCAN_CHUNK) {
        if (cancelled) return;
        const end = Math.min(start + SCAN_CHUNK, total);
        for (let i = start; i < end; i++) {
          const r = generateRecord(i);
          // search fields: name, email, phone - partial match
          if (
            r.name.toLowerCase().includes(qL) ||
            r.email.toLowerCase().includes(qL) ||
            r.phone.toLowerCase().includes(qL)
          ) {
            matches.push(r);
          }
        }
        // update progress and yield to event loop to keep UI responsive
        setSearchProgress(Math.round((end / total) * 100));
        // yield - allow paint & events
        // eslint-disable-next-line no-await-in-loop
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
      if (cancelled) return;
      setSearchResults(matches);
      setIsSearching(false);
      setSearchProgress(100);
    }

    runSearch(debQuery);
    return () => {
      cancelled = true;
    };
  }, [debQuery]);

  // helper to show how many rows available
  const countText = useMemo(() => {
    if (searchResults !== null) return `${searchResults.length} matches`;
    return `${TOTAL_RECORDS.toLocaleString()} total (loaded ${rows.length})`;
  }, [searchResults, rows.length]);

  return (
    <div className="table-wrapper">
      <div className="controls">
        <div className="left">
          <div className="search-wrapper">
            <img src={searchIcon} alt="Search Icon" className="search-icon" />
            <input
              type="text"
              placeholder="Search by name / email / phone"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="search"
            />
          </div>
          <div className="filters">
            <button className="filter-btn">
              <img src={filterIcon} alt="Filter Icon" />
              Add Filters
            </button>
            <div className="filter-dropdown">
              <div className="fd-item">Name: Any (dummy)</div>
              <div className="fd-item">Added By: Any (dummy)</div>
              <div className="fd-item">Score: Any (dummy)</div>
              <div className="fd-item">Phone: Any (dummy)</div>
            </div>
          </div>
        </div>

        <div className="right">
          <div className="count">{countText}</div>
        </div>
      </div>

      <div className="table-container" ref={containerRef}>
        <table className="customers-table">
          <thead>
            <tr>
              <th className="sticky" onClick={() => toggleSort("id")}>
                ID {sortKey === "id" ? (sortDir === "asc" ? "▲" : "▼") : ""}
              </th>
              <th className="sticky" onClick={() => toggleSort("name")}>
                Name {sortKey === "name" ? (sortDir === "asc" ? "▲" : "▼") : ""}
              </th>
              <th className="sticky" onClick={() => toggleSort("score")}>
                Score{" "}
                {sortKey === "score" ? (sortDir === "asc" ? "▲" : "▼") : ""}
              </th>
              <th className="sticky" onClick={() => toggleSort("email")}>
                Email{" "}
                {sortKey === "email" ? (sortDir === "asc" ? "▲" : "▼") : ""}
              </th>
              <th className="sticky">Last message sent at</th>
              <th className="sticky">Added By</th>
            </tr>
          </thead>
          <tbody>
            {displayedRows.map((row) => (
              <tr key={row.id}>
                <td>{row.id}</td>
                <td className="name-cell">
                  <img src={row.avatar} alt="" className="avatar" />
                  <div>
                    <div className="name">{row.name}</div>
                    <div className="small">{row.phone}</div>
                  </div>
                </td>
                <td>{row.score}</td>
                <td>{row.email}</td>
                <td className="small">
                  {new Date(row.lastMessageAt).toLocaleDateString()}
                </td>
                <td>{row.addedBy}</td>
              </tr>
            ))}
            {!isSearching && loadingPage && (
              <tr className="loading-row">
                <td colSpan="7">Loading more...</td>
              </tr>
            )}
            {isSearching && (
              <tr className="loading-row">
                <td colSpan="7">Searching... {searchProgress}%</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
