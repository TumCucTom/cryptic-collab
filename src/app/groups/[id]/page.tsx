'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

interface Group {
  id: string;
  name: string;
  code: string;
}

interface Clue {
  id: string;
  text: string;
  answer: string;
  author: { name: string };
  solutions: { correct: boolean; member: { name: string } }[];
}

interface Member {
  id: string;
  name: string;
  score: number;
}

export default function GroupPage() {
  const params = useParams();
  const groupId = params.id as string;
  const [group, setGroup] = useState<Group | null>(null);
  const [clues, setClues] = useState<Clue[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [newClue, setNewClue] = useState('');
  const [newAnswer, setNewAnswer] = useState('');
  const [solutions, setSolutions] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [activeTab, setActiveTab] = useState('clues'); // 'clues', 'create', 'leaderboard'
  const [currentClue, setCurrentClue] = useState<Clue | null>(null);
  const [showClueAnswer, setShowClueAnswer] = useState(false);

  useEffect(() => {
    fetchGroupData();
  }, [groupId]);

  const fetchGroupData = async () => {
    try {
      const [groupRes, cluesRes, membersRes] = await Promise.all([
        fetch(`/api/groups/${groupId}`),
        fetch(`/api/groups/${groupId}/clues`),
        fetch(`/api/groups/${groupId}/members`),
      ]);

      if (!groupRes.ok || !cluesRes.ok || !membersRes.ok) throw new Error('Failed to fetch data');

      const groupData = await groupRes.json();
      const cluesData = await cluesRes.json();
      const membersData = await membersRes.json();

      setGroup(groupData);
      setClues(cluesData);
      setMembers(membersData);
      
      // Set the first unsolved clue as current if no clue is selected
      if (!currentClue) {
        const firstUnsolved = cluesData.find((clue: Clue) => !clue.solutions.some((s: {correct: boolean}) => s.correct));
        if (firstUnsolved) setCurrentClue(firstUnsolved);
      }
    } catch (err) {
      setError('Failed to load group data');
    }
  };

  const handleSubmitClue = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/groups/${groupId}/clues`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newClue, answer: newAnswer }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to submit clue');
      }
      
      setNewClue('');
      setNewAnswer('');
      fetchGroupData();
      setActiveTab('clues');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit clue');
    }
  };

  const handleSubmitSolution = async (clueId: string) => {
    try {
      const res = await fetch(`/api/groups/${groupId}/clues/${clueId}/solve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer: solutions[clueId] }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to submit solution');
      }

      setSolutions(prev => ({ ...prev, [clueId]: '' }));
      setShowClueAnswer(true);
      fetchGroupData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit solution');
    }
  };

  const selectClue = (clue: Clue) => {
    setCurrentClue(clue);
    setShowClueAnswer(false);
  };

  return (
    <div className="max-w-4xl mx-auto">
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md">
          <div className="flex">
            <div className="py-1">
              <svg className="h-6 w-6 text-red-500 mr-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="flex-grow">
              <p className="font-medium">{error}</p>
              <button onClick={() => setError('')} className="text-sm text-red-600 hover:text-red-800 underline">Dismiss</button>
            </div>
          </div>
        </div>
      )}

      {group && (
        <div className="card mb-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <h1 className="text-3xl font-bold mb-4 md:mb-0">{group.name}</h1>
            <div className="flex items-center space-x-2">
              <span className="text-[color:var(--gray-dark)]">Group Code:</span>
              {showCode ? (
                <span className="font-mono bg-[color:var(--accent-light)] text-[color:var(--accent)] px-3 py-1 rounded-md">{group.code}</span>
              ) : (
                <span className="font-mono bg-[color:var(--accent-light)] text-[color:var(--accent)] px-3 py-1 rounded-md">******</span>
              )}
              <button
                onClick={() => setShowCode(!showCode)}
                className="text-[color:var(--accent)] hover:underline"
              >
                {showCode ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex mb-6 border-b border-[color:var(--gray-medium)]">
        <button
          className={`py-3 px-6 font-medium transition ${activeTab === 'clues' ? 'text-[color:var(--accent)] border-b-2 border-[color:var(--accent)]' : 'text-[color:var(--gray-dark)] hover:text-[color:var(--foreground)]'}`}
          onClick={() => setActiveTab('clues')}
        >
          Solve Clues
        </button>
        <button
          className={`py-3 px-6 font-medium transition ${activeTab === 'create' ? 'text-[color:var(--accent)] border-b-2 border-[color:var(--accent)]' : 'text-[color:var(--gray-dark)] hover:text-[color:var(--foreground)]'}`}
          onClick={() => setActiveTab('create')}
        >
          Submit Clue
        </button>
        <button
          className={`py-3 px-6 font-medium transition ${activeTab === 'leaderboard' ? 'text-[color:var(--accent)] border-b-2 border-[color:var(--accent)]' : 'text-[color:var(--gray-dark)] hover:text-[color:var(--foreground)]'}`}
          onClick={() => setActiveTab('leaderboard')}
        >
          Leaderboard
        </button>
      </div>

      {activeTab === 'create' && (
        <div className="card">
          <h2 className="text-2xl font-bold mb-6">Create a New Clue</h2>
          <form onSubmit={handleSubmitClue} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Clue Text</label>
              <input
                type="text"
                value={newClue}
                onChange={(e) => setNewClue(e.target.value)}
                className="input"
                placeholder="Enter your cryptic clue"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Answer</label>
              <input
                type="text"
                value={newAnswer}
                onChange={(e) => setNewAnswer(e.target.value)}
                className="input"
                placeholder="Enter the answer"
                required
              />
            </div>
            <button type="submit" className="btn-primary">
              Submit Clue
            </button>
          </form>
        </div>
      )}

      {activeTab === 'clues' && (
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-1 card h-fit">
            <h3 className="text-lg font-bold mb-4">Available Clues</h3>
            {clues.length === 0 ? (
              <p className="text-[color:var(--gray-dark)] italic">No clues yet. Be the first to add one!</p>
            ) : (
              <div className="space-y-3">
                {clues.map((clue) => (
                  <button
                    key={clue.id}
                    onClick={() => selectClue(clue)}
                    className={`block w-full text-left p-3 rounded-md transition ${currentClue?.id === clue.id ? 'bg-[color:var(--accent-light)] border-l-4 border-[color:var(--accent)]' : 'hover:bg-[color:var(--gray-light)]'}`}
                  >
                    <div className="flex justify-between">
                      <p className="font-medium truncate">{clue.text.length > 20 ? `${clue.text.substring(0, 20)}...` : clue.text}</p>
                      {clue.solutions.some(s => s.correct) && (
                        <span className="text-green-500">✓</span>
                      )}
                    </div>
                    <p className="text-sm text-[color:var(--gray-dark)]">by {clue.author.name}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="md:col-span-2">
            {currentClue ? (
              <div className="card">
                <div className="flex justify-between mb-4">
                  <span className="text-sm text-[color:var(--gray-dark)]">by {currentClue.author.name}</span>
                  {currentClue.solutions.some(s => s.correct) && (
                    <span className="text-sm font-medium text-green-600">
                      Solved by {currentClue.solutions.find(s => s.correct)?.member.name}
                    </span>
                  )}
                </div>
                
                <h3 className="text-2xl font-bold mb-6">{currentClue.text}</h3>
                
                {currentClue.solutions.some(s => s.correct) || showClueAnswer ? (
                  <div className="mb-8">
                    <h4 className="text-sm font-medium uppercase text-[color:var(--gray-dark)] mb-2">Answer</h4>
                    <div className="flex space-x-2">
                      {currentClue.answer.split('').map((letter, index) => (
                        <div key={index} className="w-10 h-10 border-2 border-[color:var(--accent)] rounded-md flex items-center justify-center text-lg font-bold uppercase">
                          {letter}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="mb-8 space-y-4">
                    <h4 className="text-sm font-medium uppercase text-[color:var(--gray-dark)]">Your Answer</h4>
                    <input
                      type="text"
                      value={solutions[currentClue.id] || ''}
                      onChange={(e) => setSolutions(prev => ({ ...prev, [currentClue.id]: e.target.value.toUpperCase() }))}
                      className="input text-lg uppercase"
                      placeholder="Type your answer"
                    />
                    <div className="flex space-x-4">
                      <button
                        onClick={() => handleSubmitSolution(currentClue.id)}
                        className="btn-primary"
                        disabled={!solutions[currentClue.id]}
                      >
                        Check Answer
                      </button>
                      <button className="btn-secondary" onClick={() => setShowClueAnswer(true)}>
                        Reveal Answer
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="card text-center py-12">
                <p className="text-[color:var(--gray-dark)] text-lg">
                  {clues.length === 0 
                    ? "No clues available. Create your first clue by clicking 'Submit Clue'!"
                    : "Select a clue from the list to solve it."}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'leaderboard' && (
        <div className="card">
          <h2 className="text-2xl font-bold mb-6">Leaderboard</h2>
          {members.length === 0 ? (
            <p className="text-[color:var(--gray-dark)] italic">No members yet</p>
          ) : (
            <div className="space-y-2">
              {members.sort((a, b) => b.score - a.score).map((member, index) => (
                <div 
                  key={member.id} 
                  className={`flex items-center p-3 rounded-md ${index === 0 ? 'bg-yellow-50 border border-yellow-100' : ''}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-4 font-bold ${
                    index === 0 ? 'bg-yellow-100 text-yellow-700' :
                    index === 1 ? 'bg-gray-100 text-gray-700' :
                    index === 2 ? 'bg-amber-100 text-amber-700' :
                    'bg-[color:var(--gray-light)] text-[color:var(--gray-dark)]'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="flex-grow">
                    <h3 className="font-medium">{member.name}</h3>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold">{member.score}</span>
                    <span className="text-sm text-[color:var(--gray-dark)]"> pts</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
} 