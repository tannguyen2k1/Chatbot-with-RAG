
'use client'
import React, { createContext, useState, useEffect } from 'react';
import useSWR from 'swr';
import { deleteFetcher, getFetcher, postFetcher } from '@/app/api/globalFetcher';


// Create Context
export const TicketContext = createContext();

// Provider Component
export const TicketProvider = ({ children }) => {
    const [tickets, setTickets] = useState([]);
    const [ticketSearch, setTicketSearch] = useState('');
    const [filter, setFilter] = useState('total_tickets');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch tickets from the API when the component mounts using useEffect
    const { data: ticketsData, isLoading: isTicketsLoading, error: ticketsError, mutate } = useSWR("/api/ticket", getFetcher)
    useEffect(() => {
        if (ticketsData) {
            setTickets(ticketsData.data);
            setLoading(isTicketsLoading);
        } else if (ticketsError) {
            setError(ticketsError);
            setLoading(isTicketsLoading);
        } else {
            setLoading(isTicketsLoading);
        }
    }, [ticketsData, ticketsError, isTicketsLoading]);

    // Delete a ticket with the specified ID from the server and update the tickets state
    const deleteTicket = async (id) => {
        try {
            await mutate(deleteFetcher('/api/ticket', { id }))
        } catch (err) {
            console.error('Error deleting ticket:', err);
        }
    };

    // Update the ticket search term state based on the provided search term value.
    const searchTickets = (searchTerm) => {
        setTicketSearch(searchTerm);
    };


    // Add a new ticket
    const addTicket = async (newTicket) => {
        try {

            await mutate(postFetcher('/api/ticket', newTicket))

        } catch (err) {
            console.error('Error adding ticket:', err);
        }
    };

    return (
        <TicketContext.Provider
            value={{ tickets, error, loading, deleteTicket, setTicketSearch, searchTickets, addTicket, ticketSearch, filter, setFilter }}
        >
            {children}
        </TicketContext.Provider>
    );
};


