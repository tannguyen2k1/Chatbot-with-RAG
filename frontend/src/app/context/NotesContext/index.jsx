"use client"
import React, { createContext, useState, useEffect } from 'react';
import useSWR from 'swr';
import { deleteFetcher, getFetcher, postFetcher, putFetcher } from '@/app/api/globalFetcher';



// Initial context values
const initialContext = {
    notes: [],
    loading: true,
    error: null,
    selectedNoteId: 1,
    selectNote: (id) => { },
    addNote: async (newNote) => { },
    updateNote: async (id, title, color) => { },
    deleteNote: async (id) => { },
};

// Create context
export const NotesContext = createContext(initialContext);

// Provider component
export const NotesProvider = ({ children }) => {
    const [notes, setNotes] = useState(initialContext.notes);
    const [loading, setLoading] = useState(initialContext.loading);
    const [error, setError] = useState(initialContext.error);
    const [selectedNoteId, setSelectedNoteId] = useState(initialContext.selectedNoteId);

    // Fetch notes from the server
    const { data: notesData, isLoading: isNotesLoading, error: notesError, mutate } = useSWR("/api/notes", getFetcher)
    useEffect(() => {
        if (notesData) {
            setNotes(notesData.data);
            setLoading(false);
        } else if (notesError) {
            setError(notesError);
            setLoading(false);
        } else {
            setLoading(false);
        }
    }, [notesData, notesError, isNotesLoading]);

    // Select a note by its ID
    const selectNote = (id) => {
        setSelectedNoteId(id);
    };

    // Add a new note
    const addNote = async (newNote) => {
        try {
            await mutate(postFetcher('/api/notes', newNote))
        } catch (error) {
            console.error('Error adding note:', error);
        }
    };

    // Update a note by its ID
    const updateNote = async (id, title, color) => {
        try {
            await mutate(putFetcher('/api/notes', { id, title, color }))
        } catch (error) {
            console.error('Error updating note:', error);
        }
    };

    // Delete a note by its ID
    const deleteNote = async (id) => {
        try {
            const response = await mutate(deleteFetcher('/api/notes', { id }));
            console.log(response.data);
        } catch (error) {
            console.error('Error deleting note:', error);
        }
    };

    return (
        <NotesContext.Provider
            value={{
                notes,
                loading,
                error,
                selectedNoteId,
                selectNote,
                addNote,
                updateNote,
                deleteNote,
            }}
        >
            {children}
        </NotesContext.Provider>
    );
};


