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
  
  // Filter connections based on search query
  const filteredConnections = useMemo(() => {
    if (!searchQuery.trim()) return connections;
    
    return connections.filter(conn => 
      conn.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (conn.role && conn.role.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [connections, searchQuery]);
  
  // Filter pending connections based on search query
  const filteredPendingConnections = useMemo(() => {
    if (!searchQuery.trim()) return pendingConnections;
    
    return pendingConnections.filter(conn => 
      conn.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (conn.role && conn.role.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [pendingConnections, searchQuery]);
  
  // Filter suggested connections based on search query
  const filteredSuggestedConnections = useMemo(() => {
    if (!searchQuery.trim()) return suggestedConnections;
    
    return suggestedConnections.filter(conn => 
      conn.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (conn.role && conn.role.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [suggestedConnections, searchQuery]);
  
  // Filter contact matches based on search query
  const filteredContactMatches = useMemo(() => {
    if (!searchQuery.trim()) return contactMatches;
    
    return contactMatches.filter(contact => 
      contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.phoneNumber.includes(searchQuery) ||
      (contact.email && contact.email.toLowerCase().includes(searchQuery.toLowerCase()))
    );
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