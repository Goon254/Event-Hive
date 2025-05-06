// app/hooks/useSearch.ts
import { useState, useEffect, useMemo } from 'react';
import { EnhancedConnection, ContactMatch } from '../models/connection/types';

/**
 * Hook for searching and filtering connections
 * @param connections Array of connections
 * @param pendingConnections Array of pending connections
 * @param suggestedConnections Array of suggested connections
 * @param contactMatches Array of contact matches
 * @returns Search state and filtered results
 */
export function useSearch(
  connections: EnhancedConnection[] = [],
  pendingConnections: EnhancedConnection[] = [],
  suggestedConnections: EnhancedConnection[] = [],
  contactMatches: ContactMatch[] = []
) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<EnhancedConnection[]>([]);
  
  // State for filtered results
  const [filteredConnections, setFilteredConnections] = useState<EnhancedConnection[]>(connections);
  const [filteredPendingConnections, setFilteredPendingConnections] = useState<EnhancedConnection[]>(pendingConnections);
  const [filteredSuggestedConnections, setFilteredSuggestedConnections] = useState<EnhancedConnection[]>(suggestedConnections);
  const [filteredContactMatches, setFilteredContactMatches] = useState<ContactMatch[]>(contactMatches);
  
  // Update filtered connections when connections or search query changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredConnections(connections);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredConnections(
        connections.filter(conn =>
          conn.name.toLowerCase().includes(query) ||
          (conn.role && conn.role.toLowerCase().includes(query))
        )
      );
    }
  }, [connections, searchQuery]);
  
  // Update filtered pending connections when pending connections or search query changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredPendingConnections(pendingConnections);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredPendingConnections(
        pendingConnections.filter(conn =>
          conn.name.toLowerCase().includes(query) ||
          (conn.role && conn.role.toLowerCase().includes(query))
        )
      );
    }
  }, [pendingConnections, searchQuery]);
  
  // Update filtered suggested connections when suggested connections or search query changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredSuggestedConnections(suggestedConnections);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredSuggestedConnections(
        suggestedConnections.filter(conn =>
          conn.name.toLowerCase().includes(query) ||
          (conn.role && conn.role.toLowerCase().includes(query))
        )
      );
    }
  }, [suggestedConnections, searchQuery]);
  
  // Update filtered contact matches when contact matches or search query changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredContactMatches(contactMatches);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredContactMatches(
        contactMatches.filter(contact =>
          contact.name.toLowerCase().includes(query) ||
          contact.phoneNumber.includes(query) ||
          (contact.email && contact.email.toLowerCase().includes(query))
        )
      );
    }
  }, [contactMatches, searchQuery]);
  
  // Perform global search across all connection types
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    
    const query = searchQuery.toLowerCase();
    
    // Combine all connection types and filter
    const allResults = [
      ...connections,
      ...pendingConnections,
      ...suggestedConnections,
    ].filter(conn => 
      conn.name.toLowerCase().includes(query) ||
      (conn.role && conn.role.toLowerCase().includes(query))
    );
    
    // Remove duplicates (based on id)
    const uniqueResults = Array.from(
      new Map(allResults.map(item => [item.id, item])).values()
    );
    
    setSearchResults(uniqueResults);
  }, [connections, pendingConnections, suggestedConnections, searchQuery]);
  
  // Handle search query change
  const handleSearch = (text: string) => {
    setSearchQuery(text);
  };
  
  // Clear search
  const clearSearch = () => {
    setSearchQuery('');
  };
  
  return {
    searchQuery,
    setSearchQuery,
    handleSearch,
    clearSearch,
    searchResults,
    filteredConnections,
    filteredPendingConnections,
    filteredSuggestedConnections,
    filteredContactMatches,
  };
}

// Add default export
export default useSearch;