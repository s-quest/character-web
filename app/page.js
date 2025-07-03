'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Upload, Plus, X, Save, RotateCcw, Download, Users, Zap, Camera, Image } from 'lucide-react';

const CharacterRelationshipWeb = () => {
  const svgRef = useRef(null);
  const [characters, setCharacters] = useState([
    {
      id: 1,
      name: "Dr. Zara Vex",
      age: 34,
      x: 300,
      y: 200,
      photo: null,
      floatOffset: Math.random() * Math.PI * 2 // Random phase offset for floating animation
    },
    {
      id: 2,
      name: "Commander Kael Thorne",
      age: 52,
      x: 500,
      y: 300,
      photo: null,
      floatOffset: Math.random() * Math.PI * 2
    }
  ]);

  // Animation state for floating effect
  const [animationTime, setAnimationTime] = useState(0);
  const animationRef = useRef();

  const [relationships, setRelationships] = useState([
    {
      from: 1,
      to: 2,
      fromType: 'Enemy', // A's feeling toward B
      toType: 'Enemy',   // B's feeling toward A
      intensity: 0.8
    }
  ]);

  const [draggedNode, setDraggedNode] = useState(null);
  const [selectedPair, setSelectedPair] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showRelationshipEditor, setShowRelationshipEditor] = useState(false);
  const [newCharacter, setNewCharacter] = useState({ name: '', age: '', relationships: {}, photo: null });
  const [editingCharacter, setEditingCharacter] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);

  const relationshipTypes = {
    'Ally': { color: '#10b981', lightColor: '#34d399' },
    'Enemy': { color: '#ef4444', lightColor: '#f87171' },
    'Neutral': { color: '#6b7280', lightColor: '#9ca3af' }
  };

  const relationshipOptions = [
    'Ally (mutual)',
    'Enemy (mutual)',
    'Neutral (mutual)',
    'Ally',
    'Enemy', 
    'Neutral'
  ];

  // Physics simulation for better node positioning
  const [simulation, setSimulation] = useState({ running: false });
  const [connectionMode, setConnectionMode] = useState(false);
  const [firstSelectedNode, setFirstSelectedNode] = useState(null);
  
  // Node isolation state
  const [isolatedNodeId, setIsolatedNodeId] = useState(null);

  // Auto-save key for localStorage
  const STORAGE_KEY = 'character-relationship-web-data';

  // Load data from localStorage on component mount
  useEffect(() => {
    try {
      const savedData = localStorage.getItem(STORAGE_KEY);
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        if (parsedData.characters && Array.isArray(parsedData.characters)) {
          // Ensure all characters have floatOffset for animation
          const charactersWithFloatOffset = parsedData.characters.map(char => ({
            ...char,
            floatOffset: char.floatOffset || Math.random() * Math.PI * 2
          }));
          
          // Only load if we have actual saved data (not just default data)
          if (charactersWithFloatOffset.length > 0) {
            setCharacters(charactersWithFloatOffset);
            setRelationships(parsedData.relationships || []);
            console.log(`Auto-loaded ${charactersWithFloatOffset.length} characters from browser storage`);
          }
        }
      }
    } catch (error) {
      console.error('Error loading data from localStorage:', error);
    }
  }, []);

  // Auto-save data to localStorage whenever characters or relationships change
  // Skip saving if we're still on the initial default data
  useEffect(() => {
    // Don't save the initial default characters - only save when user makes changes
    const hasDefaultData = characters.length === 2 && 
                           characters.some(char => char.name === "Dr. Zara Vex") &&
                           characters.some(char => char.name === "Commander Kael Thorne");
    
    if (!hasDefaultData && (characters.length > 0 || relationships.length > 0)) {
      try {
        const dataToSave = {
          characters,
          relationships,
          lastSaved: new Date().toISOString(),
          type: 'character-relationship-web',
          version: '1.0'
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
        console.log('Auto-saved data to browser storage');
      } catch (error) {
        console.error('Error saving data to localStorage:', error);
      }
    }
  }, [characters, relationships]);

  // Clear saved data function
  const clearSavedData = () => {
    if (confirm('Are you sure you want to clear all saved data? This will remove all characters and relationships and return to the demo data.')) {
      localStorage.removeItem(STORAGE_KEY);
      // Reset to default demo data
      setCharacters([
        {
          id: 1,
          name: "Dr. Zara Vex",
          age: 34,
          x: 300,
          y: 200,
          photo: null,
          floatOffset: Math.random() * Math.PI * 2
        },
        {
          id: 2,
          name: "Commander Kael Thorne",
          age: 52,
          x: 500,
          y: 300,
          photo: null,
          floatOffset: Math.random() * Math.PI * 2
        }
      ]);
      setRelationships([
        {
          from: 1,
          to: 2,
          fromType: 'Enemy',
          toType: 'Enemy',
          intensity: 0.8
        }
      ]);
      setIsolatedNodeId(null);
      alert('All data cleared and reset to demo data!');
    }
  };

  // Manual save function to force save current state
  const forceSave = () => {
    try {
      const dataToSave = {
        characters,
        relationships,
        lastSaved: new Date().toISOString(),
        type: 'character-relationship-web',
        version: '1.0'
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
      console.log('Manually saved data to browser storage');
      alert('Data saved successfully!');
    } catch (error) {
      console.error('Error saving data to localStorage:', error);
      alert('Error saving data. Please try exporting your data as backup.');
    }
  };

  // Animation loop for floating effect
  useEffect(() => {
    const animate = () => {
      setAnimationTime(Date.now() * 0.001); // Convert to seconds for smooth animation
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Helper function to get animated position
  const getAnimatedPosition = (character) => {
    const floatAmplitude = 8; // Increased pixels of movement for more noticeable floating
    const floatSpeed = 0.6; // Slightly faster speed
    const time = animationTime * floatSpeed + (character.floatOffset || 0);
    
    return {
      x: character.x + Math.sin(time) * floatAmplitude,
      y: character.y + Math.cos(time * 0.8) * floatAmplitude // Different frequency for more organic movement
    };
  };

  const handlePhotoUpload = (event, isEditing = false) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const photoData = e.target.result;
        if (isEditing) {
          setEditingCharacter(prev => ({ ...prev, photo: photoData }));
        } else {
          setNewCharacter(prev => ({ ...prev, photo: photoData }));
        }
      };
      reader.readAsDataURL(file);
    }
    event.target.value = '';
  };

  const removePhoto = (isEditing = false) => {
    if (isEditing) {
      setEditingCharacter(prev => ({ ...prev, photo: null }));
    } else {
      setNewCharacter(prev => ({ ...prev, photo: null }));
    }
  };

  const runPhysicsSimulation = useCallback(() => {
    if (characters.length < 1) return;
    
    setSimulation({ running: true });
    
    // SVG dimensions and safe margins
    const svgWidth = 1000;
    const svgHeight = 800;
    const margin = 80; // Safe margin from edges (accounting for node size + labels)
    const centerX = svgWidth / 2;
    const centerY = svgHeight / 2;
    
    // Calculate the largest possible radius for the polygon
    const maxRadiusX = (svgWidth - 2 * margin) / 2;
    const maxRadiusY = (svgHeight - 2 * margin) / 2;
    const radius = Math.min(maxRadiusX, maxRadiusY);
    
    // Special case: single character goes to center
    if (characters.length === 1) {
      const singleChar = characters[0];
      setCharacters([{ ...singleChar, x: centerX, y: centerY }]);
      setSimulation({ running: false });
      return;
    }
    
    // For multiple characters, arrange in regular n-gon
    const angleStep = (2 * Math.PI) / characters.length;
    
    // Create new positions array with characters arranged in equilateral n-gon
    const newPositions = characters.map((char, index) => {
      // Start at top (-π/2) and go clockwise
      const angle = -Math.PI / 2 + (index * angleStep);
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      
      return {
        ...char,
        x: Math.round(x), // Round for cleaner positioning
        y: Math.round(y)
      };
    });

    setCharacters(newPositions);
    setSimulation({ running: false });
  }, [characters]);

  const handleNameClick = (e, character) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Click on name to edit character
    setEditingCharacter({
      ...character,
      relationships: getCharacterRelationships(character.id)
    });
    setShowEditForm(true);
  };

  // Handle node click
  const handleNodeClick = (e, character) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (connectionMode) {
      if (!firstSelectedNode) {
        setFirstSelectedNode(character);
      } else if (firstSelectedNode.id !== character.id) {
        // Create/edit relationship between firstSelectedNode and character
        setSelectedPair([firstSelectedNode, character]);
        setShowRelationshipEditor(true);
        setFirstSelectedNode(null);
      }
      return;
    }
    
    // In normal mode, node clicks do nothing - just for dragging
  };

  // Handle node double-click for isolation
  const handleNodeDoubleClick = (e, character) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Toggle isolation for this character
    if (isolatedNodeId === character.id) {
      setIsolatedNodeId(null); // Remove isolation
    } else {
      setIsolatedNodeId(character.id); // Isolate this character
    }
  };

  const handleMouseDown = (e, character) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (connectionMode) {
      return; // Don't drag in connection mode
    }
    
    const rect = svgRef.current.getBoundingClientRect();
    const animatedPos = getAnimatedPosition(character);
    setDraggedNode({
      id: character.id,
      offsetX: e.clientX - rect.left - animatedPos.x,
      offsetY: e.clientY - rect.top - animatedPos.y
    });
  };

  const getCharacterRelationships = (characterId) => {
    const charRelationships = {};
    characters.forEach(otherChar => {
      if (otherChar.id !== characterId) {
        const relationship = getRelationship(characterId, otherChar.id);
        if (relationship) {
          // Determine which direction this character's feeling is
          const isFrom = relationship.from === characterId;
          const myFeeling = isFrom ? relationship.fromType : relationship.toType;
          const theirFeeling = isFrom ? relationship.toType : relationship.fromType;
          
          charRelationships[otherChar.id] = {
            type: myFeeling,
            theirType: theirFeeling,
            intensity: relationship.intensity
          };
        }
      }
    });
    return charRelationships;
  };

  const handleMouseMove = useCallback((e) => {
    if (!draggedNode) return;
    
    const rect = svgRef.current.getBoundingClientRect();
    // Keep nodes within the visible SVG bounds during manual dragging
    const newX = Math.max(50, Math.min(950, e.clientX - rect.left - draggedNode.offsetX));
    const newY = Math.max(50, Math.min(750, e.clientY - rect.top - draggedNode.offsetY));
    
    setCharacters(prev => prev.map(char => 
      char.id === draggedNode.id 
        ? { ...char, x: newX, y: newY }
        : char
    ));
  }, [draggedNode]);

  const handleMouseUp = useCallback(() => {
    setDraggedNode(null);
  }, []);

  useEffect(() => {
    if (draggedNode) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [draggedNode, handleMouseMove, handleMouseUp]);

  const getRelationship = (id1, id2) => {
    return relationships.find(rel => 
      (rel.from === id1 && rel.to === id2) || 
      (rel.from === id2 && rel.to === id1)
    );
  };

  const setRelationship = (id1, id2, type, intensity, isMutual = false) => {
    setRelationships(prev => {
      const existing = prev.find(rel => 
        (rel.from === id1 && rel.to === id2) || 
        (rel.from === id2 && rel.to === id1)
      );
      
      if (existing) {
        // Determine which direction we're setting
        const isForward = existing.from === id1;
        
        if (isMutual) {
          // Set both directions to the same type
          return prev.map(rel => 
            rel === existing 
              ? { ...rel, fromType: type, toType: type, intensity }
              : rel
          );
        } else {
          // Set only one direction, preserve the other
          return prev.map(rel => 
            rel === existing 
              ? { 
                  ...rel, 
                  [isForward ? 'fromType' : 'toType']: type,
                  intensity 
                }
              : rel
          );
        }
      } else {
        // Create new relationship
        if (isMutual) {
          return [...prev, { from: id1, to: id2, fromType: type, toType: type, intensity }];
        } else {
          // For new non-mutual relationships, set the specified direction and default the other to 'Neutral'
          return [...prev, { from: id1, to: id2, fromType: type, toType: 'Neutral', intensity }];
        }
      }
    });
  };

  const removeRelationship = (id1, id2) => {
    setRelationships(prev => prev.filter(rel => 
      !((rel.from === id1 && rel.to === id2) || 
        (rel.from === id2 && rel.to === id1))
    ));
  };

  const addCharacter = () => {
    if (!newCharacter.name.trim()) return;
    
    const newChar = {
      id: Date.now(),
      name: newCharacter.name.trim(),
      age: parseInt(newCharacter.age) || 0,
      x: 300 + (Math.random() - 0.5) * 200,
      y: 300 + (Math.random() - 0.5) * 200,
      photo: newCharacter.photo,
      floatOffset: Math.random() * Math.PI * 2 // Random phase for floating animation
    };
    
    setCharacters(prev => [...prev, newChar]);
    
    // Add relationships
    Object.entries(newCharacter.relationships).forEach(([otherId, relationship]) => {
      if (relationship.type && relationship.type !== 'None') {
        setRelationship(newChar.id, parseInt(otherId), relationship.type, relationship.intensity, relationship.isMutual);
      }
    });
    
    setNewCharacter({ name: '', age: '', relationships: {}, photo: null });
    setShowAddForm(false);
  };

  const updateCharacter = () => {
    if (!editingCharacter.name.trim()) return;
    
    setCharacters(prev => prev.map(char => 
      char.id === editingCharacter.id 
        ? {
            ...char,
            name: editingCharacter.name.trim(),
            age: parseInt(editingCharacter.age) || 0,
            photo: editingCharacter.photo
          }
        : char
    ));
    
    // Update relationships more carefully - preserve relationships from other characters
    setRelationships(prev => {
      // Keep all relationships that don't involve the edited character
      const unrelatedRelationships = prev.filter(rel => 
        rel.from !== editingCharacter.id && rel.to !== editingCharacter.id
      );
      
      // Get existing relationships involving the edited character
      const existingRelationships = prev.filter(rel => 
        rel.from === editingCharacter.id || rel.to === editingCharacter.id
      );
      
      // Start with unrelated relationships
      let updatedRelationships = [...unrelatedRelationships];
      
      // Process each relationship from the form
      Object.entries(editingCharacter.relationships).forEach(([otherId, relationship]) => {
        const otherIdNum = parseInt(otherId);
        if (relationship.type && relationship.type !== 'None') {
          // Find if there's an existing relationship between these characters
          const existing = existingRelationships.find(rel => 
            (rel.from === editingCharacter.id && rel.to === otherIdNum) || 
            (rel.from === otherIdNum && rel.to === editingCharacter.id)
          );
          
          if (existing) {
            // Update existing relationship, preserving the structure
            const isEditedCharFrom = existing.from === editingCharacter.id;
            
            if (relationship.isMutual) {
              // Set both directions to the same type
              updatedRelationships.push({
                ...existing,
                fromType: relationship.type,
                toType: relationship.type,
                intensity: relationship.intensity
              });
            } else {
              // Update only the edited character's direction, preserve the other
              updatedRelationships.push({
                ...existing,
                [isEditedCharFrom ? 'fromType' : 'toType']: relationship.type,
                intensity: relationship.intensity
              });
            }
          } else {
            // Create new relationship
            if (relationship.isMutual) {
              updatedRelationships.push({
                from: editingCharacter.id,
                to: otherIdNum,
                fromType: relationship.type,
                toType: relationship.type,
                intensity: relationship.intensity
              });
            } else {
              updatedRelationships.push({
                from: editingCharacter.id,
                to: otherIdNum,
                fromType: relationship.type,
                toType: 'Neutral',
                intensity: relationship.intensity
              });
            }
          }
        }
      });
      
      return updatedRelationships;
    });
    
    setEditingCharacter(null);
    setShowEditForm(false);
  };

  const deleteCharacter = (characterId) => {
    setCharacters(prev => prev.filter(char => char.id !== characterId));
    setRelationships(prev => prev.filter(rel => 
      rel.from !== characterId && rel.to !== characterId
    ));
    setEditingCharacter(null);
    setShowEditForm(false);
  };

  const importDatabase = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedData = JSON.parse(e.target.result);
          
          // Check if this is a character relationship web export
          if (importedData.type === 'character-relationship-web' && importedData.characters && Array.isArray(importedData.characters)) {
            // Import with exact positions and all data
            const importedChars = importedData.characters.map(char => ({
              ...char,
              floatOffset: char.floatOffset || Math.random() * Math.PI * 2 // Preserve or create floating animation offset
            }));
            
            setCharacters(importedChars);
            setRelationships(importedData.relationships || []);
            alert(`Successfully imported ${importedChars.length} characters with ${importedData.relationships?.length || 0} relationships! Your data will be automatically saved in your browser.`);
          } else if (importedData.characters && Array.isArray(importedData.characters)) {
            // Legacy import - arrange in grid
            const importedChars = importedData.characters.map((char, index) => ({
              id: char.id || Date.now() + index,
              name: char.name || 'Unknown',
              age: char.age || 0,
              x: 200 + (index % 5) * 120,
              y: 200 + Math.floor(index / 5) * 120,
              photo: char.photo || null,
              floatOffset: Math.random() * Math.PI * 2
            }));
            
            setCharacters(importedChars);
            setRelationships([]); // Clear existing relationships for legacy imports
            alert(`Successfully imported ${importedChars.length} characters! Your data will be automatically saved in your browser.`);
          } else {
            alert('Invalid file format. Please select a valid character relationship web export file.');
          }
        } catch (error) {
          alert('Error reading file. Please make sure it\'s a valid JSON file.');
        }
      };
      reader.readAsText(file);
    }
    event.target.value = '';
  };

  const copyData = async () => {
    const exportData = {
      characters,
      relationships,
      exportDate: new Date().toISOString(),
      type: 'character-relationship-web',
      version: '1.0'
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    
    try {
      await navigator.clipboard.writeText(dataStr);
      alert('Character web data copied to clipboard! You can paste this into a text file to save it as a backup. Note: Your data is automatically saved in your browser and will persist between sessions.');
    } catch (err) {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = dataStr;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('Character web data copied to clipboard! You can paste this into a text file to save it as a backup. Note: Your data is automatically saved in your browser and will persist between sessions.');
    }
  };

  const RelationshipEditor = () => {
    if (!selectedPair) return null;
    
    const [char1, char2] = selectedPair;
    const existing = getRelationship(char1.id, char2.id);
    
    // Determine current relationship types
    const char1ToChar2 = existing ? (existing.from === char1.id ? existing.fromType : existing.toType) : 'Neutral';
    const char2ToChar1 = existing ? (existing.from === char1.id ? existing.toType : existing.fromType) : 'Neutral';
    
    const [char1Type, setChar1Type] = useState(char1ToChar2);
    const [char2Type, setChar2Type] = useState(char2ToChar1);
    const [intensity, setIntensity] = useState(existing?.intensity || 0.5);
    
    const handleSave = (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      // Set both directions of the relationship
      setRelationships(prev => {
        const existing = prev.find(rel => 
          (rel.from === char1.id && rel.to === char2.id) || 
          (rel.from === char2.id && rel.to === char1.id)
        );
        
        if (existing) {
          return prev.map(rel => 
            rel === existing 
              ? { 
                  ...rel, 
                  fromType: rel.from === char1.id ? char1Type : char2Type,
                  toType: rel.from === char1.id ? char2Type : char1Type,
                  intensity 
                }
              : rel
          );
        } else {
          return [...prev, { 
            from: char1.id, 
            to: char2.id, 
            fromType: char1Type, 
            toType: char2Type, 
            intensity 
          }];
        }
      });
      
      setShowRelationshipEditor(false);
      setSelectedPair(null);
    };
    
    const handleRemove = (e) => {
      e.preventDefault();
      e.stopPropagation();
      removeRelationship(char1.id, char2.id);
      setShowRelationshipEditor(false);
      setSelectedPair(null);
    };
    
    const handleClose = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setShowRelationshipEditor(false);
      setSelectedPair(null);
    };
    
    return (
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
        onClick={handleClose}
      >
        <div 
          className="bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 max-w-md w-full"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-white">Edit Relationship</h3>
            <button
              onClick={handleClose}
              className="p-2 bg-slate-700/50 hover:bg-slate-600/50 text-slate-400 hover:text-white rounded-lg transition-colors duration-200"
            >
              <X size={16} />
            </button>
          </div>
          
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-slate-300">
                <span className="text-cyan-400 font-medium">{char1.name}</span>
                <span className="mx-2">↔</span>
                <span className="text-cyan-400 font-medium">{char2.name}</span>
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                {char1.name}'s feeling toward {char2.name}
              </label>
              <select
                value={char1Type}
                onChange={(e) => {
                  e.stopPropagation();
                  setChar1Type(e.target.value);
                }}
                className="w-full bg-slate-800/50 border border-slate-600/50 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500/50"
                onClick={(e) => e.stopPropagation()}
              >
                <option value="Ally">Ally</option>
                <option value="Enemy">Enemy</option>
                <option value="Neutral">Neutral</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                {char2.name}'s feeling toward {char1.name}
              </label>
              <select
                value={char2Type}
                onChange={(e) => {
                  e.stopPropagation();
                  setChar2Type(e.target.value);
                }}
                className="w-full bg-slate-800/50 border border-slate-600/50 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500/50"
                onClick={(e) => e.stopPropagation()}
              >
                <option value="Ally">Ally</option>
                <option value="Enemy">Enemy</option>
                <option value="Neutral">Neutral</option>
              </select>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setChar1Type('Ally');
                  setChar2Type('Ally');
                }}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs transition-colors duration-200"
                type="button"
              >
                Mutual Ally
              </button>
              <button
                onClick={() => {
                  setChar1Type('Enemy');
                  setChar2Type('Enemy');
                }}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs transition-colors duration-200"
                type="button"
              >
                Mutual Enemy
              </button>
              <button
                onClick={() => {
                  setChar1Type('Neutral');
                  setChar2Type('Neutral');
                }}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-xs transition-colors duration-200"
                type="button"
              >
                Mutual Neutral
              </button>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Intensity: {Math.round(intensity * 100)}%
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={intensity}
                onChange={(e) => {
                  e.stopPropagation();
                  setIntensity(parseFloat(e.target.value));
                }}
                onClick={(e) => e.stopPropagation()}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>Weak</span>
                <span>Strong</span>
              </div>
            </div>
            
            <div className="flex gap-3 pt-4">
              <button
                onClick={handleSave}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                type="button"
              >
                <Save size={16} />
                Save
              </button>
              {existing && (
                <button
                  onClick={handleRemove}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                  type="button"
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Get node opacity based on isolation state
  const getNodeOpacity = (nodeId) => {
    if (isolatedNodeId === null) return 1;
    return isolatedNodeId === nodeId ? 1 : 0.1;
  };

  // Get relationship opacity based on isolation state
  const getRelationshipOpacity = (relationship) => {
    if (isolatedNodeId === null) return 1;
    return (relationship.from === isolatedNodeId || relationship.to === isolatedNodeId) ? 1 : 0.1;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-2">
              Character Relationship Web
            </h1>
            <p className="text-slate-400">Visualize and edit character connections</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-4 py-2 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-cyan-500/25"
            >
              <Plus size={18} />
              Add Character
            </button>
            
            <label className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white px-4 py-2 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-purple-500/25 cursor-pointer">
              <Upload size={18} />
              Import
              <input
                type="file"
                accept=".json"
                onChange={importDatabase}
                className="hidden"
              />
            </label>
            
            <button
              onClick={copyData}
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white px-4 py-2 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-emerald-500/25"
            >
              <Download size={18} />
              Copy Data
            </button>
            
            <button
              onClick={runPhysicsSimulation}
              disabled={simulation.running}
              className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white px-4 py-2 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-amber-500/25 disabled:opacity-50"
            >
              <Zap size={18} />
              {simulation.running ? 'Organizing...' : 'Auto Layout'}
            </button>
            
            <button
              onClick={clearSavedData}
              className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-2 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-red-500/25"
            >
              <X size={18} />
              Clear All
            </button>
          </div>
        </div>
      </div>

      {/* Add/Edit Character Form */}
      {(showAddForm || showEditForm) && (
        <div className="max-w-7xl mx-auto mb-6">
          <div className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">
              {showAddForm ? 'Add Character' : 'Edit Character'}
            </h2>
            
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <input
                type="text"
                placeholder="Name"
                value={showAddForm ? newCharacter.name : editingCharacter?.name || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  if (showAddForm) {
                    setNewCharacter(prev => ({ ...prev, name: value }));
                  } else {
                    setEditingCharacter(prev => ({ ...prev, name: value }));
                  }
                }}
                className="bg-slate-800/50 border border-slate-600/50 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500/50"
              />
              <input
                type="number"
                placeholder="Age"
                value={showAddForm ? newCharacter.age : editingCharacter?.age || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  if (showAddForm) {
                    setNewCharacter(prev => ({ ...prev, age: value }));
                  } else {
                    setEditingCharacter(prev => ({ ...prev, age: value }));
                  }
                }}
                className="bg-slate-800/50 border border-slate-600/50 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500/50"
              />
            </div>
            
            {/* Photo Upload Section */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-3">Character Photo</h3>
              <div className="flex items-center gap-4">
                {(showAddForm ? newCharacter.photo : editingCharacter?.photo) ? (
                  <div className="relative">
                    <img
                      src={showAddForm ? newCharacter.photo : editingCharacter?.photo}
                      alt="Character"
                      className="w-24 h-24 object-cover rounded-xl border-2 border-cyan-500/50"
                    />
                    <button
                      onClick={() => removePhoto(showEditForm)}
                      className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 text-xs transition-colors duration-200"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <div className="w-24 h-24 bg-slate-800/50 border-2 border-dashed border-slate-600/50 rounded-xl flex items-center justify-center">
                    <Image className="text-slate-500" size={24} />
                  </div>
                )}
                
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 cursor-pointer">
                    <Camera size={16} />
                    {(showAddForm ? newCharacter.photo : editingCharacter?.photo) ? 'Change Photo' : 'Upload Photo'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handlePhotoUpload(e, showEditForm)}
                      className="hidden"
                    />
                  </label>
                  <p className="text-slate-400 text-xs">JPG, PNG, GIF up to 10MB</p>
                </div>
              </div>
            </div>
            {characters.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-3">Relationships</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {characters
                    .filter(char => showAddForm || char.id !== editingCharacter?.id)
                    .map(otherChar => {
                      const currentRelationships = showAddForm ? newCharacter.relationships : editingCharacter?.relationships || {};
                      const relationship = currentRelationships[otherChar.id] || { type: 'None', intensity: 0.5 };
                      
                      return (
                        <div key={otherChar.id} className="bg-slate-800/30 rounded-lg p-4 border border-slate-600/30">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-cyan-400 font-medium">{otherChar.name}</span>
                            <span className="text-slate-400 text-sm">Age {otherChar.age}</span>
                          </div>
                          
                          <div className="space-y-3">
                            <select
                              value={relationship.type}
                              onChange={(e) => {
                                const value = e.target.value;
                                let newType, isMutual;
                                
                                if (value.includes('(mutual)')) {
                                  newType = value.replace(' (mutual)', '');
                                  isMutual = true;
                                } else {
                                  newType = value;
                                  isMutual = false;
                                }
                                
                                if (showAddForm) {
                                  setNewCharacter(prev => ({
                                    ...prev,
                                    relationships: {
                                      ...prev.relationships,
                                      [otherChar.id]: { ...relationship, type: newType, isMutual }
                                    }
                                  }));
                                } else {
                                  setEditingCharacter(prev => ({
                                    ...prev,
                                    relationships: {
                                      ...prev.relationships,
                                      [otherChar.id]: { ...relationship, type: newType, isMutual }
                                    }
                                  }));
                                }
                              }}
                              className="w-full bg-slate-700/50 border border-slate-600/50 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500/50"
                            >
                              <option value="None">No Relationship</option>
                              {relationshipOptions.map(option => (
                                <option key={option} value={option}>{option}</option>
                              ))}
                            </select>
                            
                            {relationship.type !== 'None' && (
                              <div>
                                <div className="flex justify-between text-sm text-slate-300 mb-1">
                                  <span>Intensity</span>
                                  <span>{Math.round(relationship.intensity * 100)}%</span>
                                </div>
                                <input
                                  type="range"
                                  min="0"
                                  max="1"
                                  step="0.1"
                                  value={relationship.intensity}
                                  onChange={(e) => {
                                    const newIntensity = parseFloat(e.target.value);
                                    if (showAddForm) {
                                      setNewCharacter(prev => ({
                                        ...prev,
                                        relationships: {
                                          ...prev.relationships,
                                          [otherChar.id]: { ...relationship, intensity: newIntensity }
                                        }
                                      }));
                                    } else {
                                      setEditingCharacter(prev => ({
                                        ...prev,
                                        relationships: {
                                          ...prev.relationships,
                                          [otherChar.id]: { ...relationship, intensity: newIntensity }
                                        }
                                      }));
                                    }
                                  }}
                                  className="w-full"
                                  style={{
                                    background: `linear-gradient(to right, ${relationshipTypes[relationship.type]?.color || '#6b7280'}20 0%, ${relationshipTypes[relationship.type]?.color || '#6b7280'} 100%)`
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
            
            <div className="flex gap-3">
              <button
                onClick={showAddForm ? addCharacter : updateCharacter}
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2"
              >
                <Save size={16} />
                {showAddForm ? 'Add Character' : 'Update Character'}
              </button>
              
              {showEditForm && (
                <button
                  onClick={() => deleteCharacter(editingCharacter.id)}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                >
                  Delete
                </button>
              )}
              
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setShowEditForm(false);
                  setEditingCharacter(null);
                  setNewCharacter({ name: '', age: '', relationships: {}, photo: null });
                }}
                className="bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="bg-gradient-to-br from-slate-900/60 to-slate-800/60 backdrop-blur-sm border border-slate-700/30 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <span className="text-slate-400 text-sm font-medium">Relationships:</span>
              {Object.entries(relationshipTypes).map(([type, colors]) => (
                <div key={type} className="flex items-center gap-2">
                  <div
                    className="w-4 h-1 rounded"
                    style={{ backgroundColor: colors.color }}
                  ></div>
                  <span className="text-slate-300 text-sm">{type}</span>
                </div>
              ))}
            </div>
            <div className="text-slate-400 text-sm">
              {connectionMode 
                ? 'Connection Mode: Click nodes to connect them'
                : 'Click names to edit • Drag nodes to move • Double-click nodes to isolate • Auto-saved in browser'
              }
            </div>
          </div>
        </div>
      </div>

      {/* Main Web Visualization */}
      <div className="max-w-7xl mx-auto">
        <div className="bg-gradient-to-br from-slate-900/40 to-slate-800/40 backdrop-blur-sm border border-slate-700/30 rounded-2xl p-6 overflow-hidden">
          <svg
            ref={svgRef}
            width="1000"
            height="800"
            className="w-full h-full bg-slate-950/20 rounded-xl border border-slate-700/20"
            style={{ minHeight: '600px' }}
            viewBox="0 0 1000 800"
          >
            {/* Render relationship lines */}
            {characters.map(char1 => 
              characters.map(char2 => {
                if (char1.id >= char2.id) return null;
                const relationship = getRelationship(char1.id, char2.id);
                if (!relationship) return null;
                
                // Determine the relationship types for each direction
                const char1ToChar2 = relationship.from === char1.id ? relationship.fromType : relationship.toType;
                const char2ToChar1 = relationship.from === char1.id ? relationship.toType : relationship.fromType;
                
                const strokeWidth = 2 + (relationship.intensity * 3);
                const opacity = 0.4 + (relationship.intensity * 0.6);
                
                // Check if this relationship should be faded for isolation
                const isIsolated = isolatedNodeId !== null;
                const isRelevantToIsolated = isIsolated && (char1.id === isolatedNodeId || char2.id === isolatedNodeId);
                const shouldFade = isIsolated && !isRelevantToIsolated;
                
                // Adjust opacity based on isolation
                const finalOpacity = shouldFade ? opacity * 0.15 : opacity; // Fade to 15% if not relevant
                
                // Get animated positions for both characters
                const pos1 = getAnimatedPosition(char1);
                const pos2 = getAnimatedPosition(char2);
                
                // Create unique gradient ID for this relationship
                const gradientId = `gradient-${char1.id}-${char2.id}`;
                
                // Check if it's a mutual relationship (same type both ways)
                const isMutual = char1ToChar2 === char2ToChar1;
                
                return (
                  <g key={`${char1.id}-${char2.id}`}>
                    {/* Define gradient for this specific relationship */}
                    <defs>
                      <linearGradient 
                        id={gradientId} 
                        x1={pos1.x} 
                        y1={pos1.y} 
                        x2={pos2.x} 
                        y2={pos2.y}
                        gradientUnits="userSpaceOnUse"
                      >
                        {isMutual ? (
                          // Mutual relationship - single color
                          <>
                            <stop offset="0%" stopColor={relationshipTypes[char1ToChar2].color} />
                            <stop offset="100%" stopColor={relationshipTypes[char1ToChar2].color} />
                          </>
                        ) : (
                          // Non-mutual relationship - gradient from char1 to char2
                          <>
                            <stop offset="0%" stopColor={relationshipTypes[char1ToChar2].color} />
                            <stop offset="40%" stopColor={relationshipTypes[char1ToChar2].color} />
                            <stop offset="60%" stopColor={relationshipTypes[char2ToChar1].color} />
                            <stop offset="100%" stopColor={relationshipTypes[char2ToChar1].color} />
                          </>
                        )}
                      </linearGradient>
                    </defs>
                    
                    {/* Outer glow effect */}
                    <line
                      x1={pos1.x}
                      y1={pos1.y}
                      x2={pos2.x}
                      y2={pos2.y}
                      stroke={`url(#${gradientId})`}
                      strokeWidth={strokeWidth + 4}
                      opacity={finalOpacity * 0.3}
                    />
                    {/* Main line */}
                    <line
                      x1={pos1.x}
                      y1={pos1.y}
                      x2={pos2.x}
                      y2={pos2.y}
                      stroke={`url(#${gradientId})`}
                      strokeWidth={strokeWidth}
                      opacity={finalOpacity}
                      className="pointer-events-none"
                    />
                    {/* Inner highlight */}
                    <line
                      x1={pos1.x}
                      y1={pos1.y}
                      x2={pos2.x}
                      y2={pos2.y}
                      stroke="white"
                      strokeWidth={Math.max(1, strokeWidth * 0.2)}
                      opacity={finalOpacity * 0.3}
                      className="pointer-events-none"
                    />
                  </g>
                );
              })
            )}
            
            {/* Render character nodes */}
            {characters.map(character => {
              const isSelected = firstSelectedNode?.id === character.id;
              const isSelectable = connectionMode && characters.length > 1;
              const animatedPos = getAnimatedPosition(character);
              
              // Check if this node should be faded for isolation
              const isIsolated = isolatedNodeId !== null;
              const isTheIsolatedNode = character.id === isolatedNodeId;
              
              // Check if this node has a relationship with the isolated node
              const hasRelationshipWithIsolated = isIsolated && isolatedNodeId && 
                getRelationship(character.id, isolatedNodeId) !== undefined;
              
              const shouldFadeNode = isIsolated && !isTheIsolatedNode && !hasRelationshipWithIsolated;
              const nodeOpacity = shouldFadeNode ? 0.3 : 1.0; // Fade unrelated nodes to 30%
              const nodeScale = isTheIsolatedNode ? 1.8 : 1.0; // Scale up isolated node by 1.8x
              
              return (
                <g key={character.id} opacity={nodeOpacity}>
                  {/* Character photo or default circle */}
                  {character.photo ? (
                    <g>
                      <defs>
                        <clipPath id={`clip-${character.id}`}>
                          <circle cx={animatedPos.x} cy={animatedPos.y} r={28 * nodeScale} />
                        </clipPath>
                      </defs>
                      {/* Outer glow for photo nodes */}
                      <circle
                        cx={animatedPos.x}
                        cy={animatedPos.y}
                        r={32 * nodeScale}
                        fill={isSelected ? "#a855f7" : "#06b6d4"}
                        opacity="0.2"
                        filter="url(#nodeGlow)"
                        className="pointer-events-none"
                      />
                      {/* Invisible larger circle for easier dragging */}
                      <circle
                        cx={animatedPos.x}
                        cy={animatedPos.y}
                        r={35 * nodeScale}
                        fill="transparent"
                        className={`${isSelectable ? 'cursor-pointer' : 'cursor-move'}`}
                        onClick={(e) => handleNodeClick(e, character)}
                        onDoubleClick={(e) => handleNodeDoubleClick(e, character)}
                        onMouseDown={(e) => handleMouseDown(e, character)}
                      />
                      <image
                        href={character.photo}
                        x={animatedPos.x - (28 * nodeScale)}
                        y={animatedPos.y - (28 * nodeScale)}
                        width={56 * nodeScale}
                        height={56 * nodeScale}
                        clipPath={`url(#clip-${character.id})`}
                        preserveAspectRatio="xMidYMid slice"
                        className="pointer-events-none"
                      />
                      <circle
                        cx={animatedPos.x}
                        cy={animatedPos.y}
                        r={28 * nodeScale}
                        fill="none"
                        stroke={isSelected ? "#a855f7" : "#06b6d4"}
                        strokeWidth={isSelected ? "3" : "2"}
                        className="pointer-events-none transition-colors duration-200"
                        filter="url(#nodeGlow)"
                      />
                    </g>
                  ) : (
                    <g>
                      {/* Outer glow for default nodes */}
                      <circle
                        cx={animatedPos.x}
                        cy={animatedPos.y}
                        r={32 * nodeScale}
                        fill={isSelected ? "url(#selectedNodeGradient)" : "url(#nodeGradient)"}
                        opacity="0.3"
                        filter="url(#nodeGlow)"
                        className="pointer-events-none"
                      />
                      <circle
                        cx={animatedPos.x}
                        cy={animatedPos.y}
                        r={28 * nodeScale}
                        fill={isSelected ? "url(#selectedNodeGradient)" : "url(#nodeGradient)"}
                        stroke={isSelected ? "#a855f7" : "#06b6d4"}
                        strokeWidth={isSelected ? "3" : "2"}
                        className={`${isSelectable ? 'cursor-pointer hover:stroke-violet-400' : 'cursor-move hover:stroke-cyan-300'} transition-colors duration-200`}
                        onClick={(e) => handleNodeClick(e, character)}
                        onDoubleClick={(e) => handleNodeDoubleClick(e, character)}
                        onMouseDown={(e) => handleMouseDown(e, character)}
                        filter="url(#nodeGlow)"
                      />
                    </g>
                  )}
                  
                  {isSelected && (
                    <g>
                      <circle
                        cx={animatedPos.x}
                        cy={animatedPos.y}
                        r={35 * nodeScale}
                        fill="none"
                        stroke="#a855f7"
                        strokeWidth="2"
                        opacity="0.6"
                        filter="url(#nodeGlow)"
                        className="animate-pulse"
                      />
                      <circle
                        cx={animatedPos.x}
                        cy={animatedPos.y}
                        r={40 * nodeScale}
                        fill="none"
                        stroke="#a855f7"
                        strokeWidth="1"
                        opacity="0.3"
                        filter="url(#nodeGlow)"
                        className="animate-pulse"
                        style={{ animationDelay: '0.5s' }}
                      />
                    </g>
                  )}
                  <text
                    x={animatedPos.x}
                    y={animatedPos.y + (40 + (nodeScale - 1) * 28)} // Adjust text position based on node scale
                    textAnchor="middle"
                    className="text-white text-sm font-medium cursor-pointer hover:text-cyan-300 transition-colors duration-200"
                    fill="white"
                    onClick={(e) => handleNameClick(e, character)}
                  >
                    {character.name}
                  </text>
                  <text
                    x={animatedPos.x}
                    y={animatedPos.y + (55 + (nodeScale - 1) * 28)} // Adjust text position based on node scale
                    textAnchor="middle"
                    className="text-slate-400 text-xs pointer-events-none select-none"
                    fill="#94a3b8"
                  >
                    Age {character.age}
                  </text>
                  
                  {/* Hover tooltip */}
                  <title>
                    {character.name} (Age {character.age})
                    {connectionMode && ' - Click node to select for connection'}
                    {'\nClick name to edit • Drag node to move • Double-click to isolate relationships'}
                  </title>
                </g>
              );
            })}
            
            {/* Enhanced gradient and filter definitions */}
            <defs>
              {/* Node gradients */}
              <radialGradient id="nodeGradient" cx="0.3" cy="0.3">
                <stop offset="0%" stopColor="#22d3ee" />
                <stop offset="50%" stopColor="#0891b2" />
                <stop offset="100%" stopColor="#0e7490" />
              </radialGradient>
              <radialGradient id="selectedNodeGradient" cx="0.3" cy="0.3">
                <stop offset="0%" stopColor="#c084fc" />
                <stop offset="50%" stopColor="#a855f7" />
                <stop offset="100%" stopColor="#7c3aed" />
              </radialGradient>
              
              {/* Glow filters */}
              <filter id="nodeGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge> 
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
              
              {/* Line glow filters for each relationship type */}
              <filter id="glow-Ally" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                <feMerge> 
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
              
              <filter id="glow-Enemy" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                <feMerge> 
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
              
              <filter id="glow-Neutral" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                <feMerge> 
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
          </svg>
        </div>
      </div>

      {/* Empty state */}
      {characters.length === 0 && (
        <div className="max-w-7xl mx-auto text-center py-12">
          <Users className="mx-auto text-slate-600 mb-4" size={48} />
          <p className="text-slate-400 text-lg">No characters in your web yet.</p>
          <p className="text-slate-500 text-sm">Add characters or import from your database to get started.</p>
        </div>
      )}

      {/* Relationship Editor Modal */}
      {showRelationshipEditor && <RelationshipEditor />}
    </div>
  );
};

export default CharacterRelationshipWeb;