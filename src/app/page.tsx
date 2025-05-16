'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [joinCode, setJoinCode] = useState('');
  const [joinName, setJoinName] = useState('');
  const [createName, setCreateName] = useState('');
  const [groupName, setGroupName] = useState('');
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  const handleJoinGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/groups/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: joinCode, memberName: joinName }),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to join group');
      }
      const data = await res.json();
      router.push(`/groups/${data.groupId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join group');
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/groups/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupName, memberName: createName }),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to create group');
      }
      const data = await res.json();
      router.push(`/groups/${data.groupId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create group');
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Share & Solve Cryptic Clues Together</h1>
      <p className="text-gray-600 mb-6">Create groups with friends, share cryptic clues, and track progress together</p>
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          <p>{error}</p>
        </div>
      )}

      <div className="mb-8">
        <div className="mb-4">
          <button 
            className={`mr-4 font-medium ${!showCreateForm ? 'underline text-purple-700' : ''}`}
            onClick={() => setShowCreateForm(false)}
          >
            Join a Group
          </button>
          <button 
            className={`font-medium ${showCreateForm ? 'underline text-purple-700' : ''}`}
            onClick={() => setShowCreateForm(true)}
          >
            Create a Group
          </button>
        </div>
        
        {!showCreateForm ? (
          <form onSubmit={handleJoinGroup} className="space-y-4">
            <div>
              <label className="block mb-1">Your Name</label>
              <input
                type="text"
                value={joinName}
                onChange={(e) => setJoinName(e.target.value)}
                className="border p-2 w-full max-w-xs rounded"
                placeholder="Enter your name"
                required
              />
            </div>
            <div>
              <label className="block mb-1">Group Code</label>
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                className="border p-2 w-full max-w-xs rounded"
                placeholder="Enter group code"
                required
              />
            </div>
            <button type="submit" className="bg-purple-700 text-white px-4 py-2 rounded hover:bg-purple-800">
              Join Group
            </button>
          </form>
        ) : (
          <form onSubmit={handleCreateGroup} className="space-y-4">
            <div>
              <label className="block mb-1">Your Name</label>
              <input
                type="text"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                className="border p-2 w-full max-w-xs rounded"
                placeholder="Enter your name"
                required
              />
            </div>
            <div>
              <label className="block mb-1">Group Name</label>
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="border p-2 w-full max-w-xs rounded"
                placeholder="Enter group name"
                required
              />
            </div>
            <button type="submit" className="bg-purple-700 text-white px-4 py-2 rounded hover:bg-purple-800">
              Create Group
            </button>
          </form>
        )}
      </div>

      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-4">How It Works</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-bold">1. Create or Join a Group</h3>
            <p className="text-gray-600">Start by creating a new group or joining an existing one with a code</p>
          </div>
          <div>
            <h3 className="font-bold">2. Share Cryptic Clues</h3>
            <p className="text-gray-600">Post your favorite cryptic crossword clues with their answers</p>
          </div>
          <div>
            <h3 className="font-bold">3. Solve & Compete</h3>
            <p className="text-gray-600">Solve clues from others and climb up the leaderboard</p>
          </div>
        </div>
      </div>
    </div>
  );
}
