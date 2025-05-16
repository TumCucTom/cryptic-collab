'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';

interface Group { id: string; name: string; code: string; }
interface Clue {
  id: string;
  text: string;
  answer: string;
  author: { name: string };
  solutions: { correct: boolean; member: { name: string } }[];
}
interface Member { id: string; name: string; score: number; }

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
  const [activeTab, setActiveTab] = useState('clues');
  const [currentClue, setCurrentClue] = useState<Clue | null>(null);
  const [showClueAnswer, setShowClueAnswer] = useState(false);

  const fetchGroupData = useCallback(async () => {
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
      if (!currentClue) {
        const firstUnsolved = cluesData.find((clue: Clue) => !clue.solutions.some(s => s.correct));
        if (firstUnsolved) setCurrentClue(firstUnsolved);
      }
    } catch {
      setError('Failed to load group data');
    }
  }, [groupId, currentClue]);

  useEffect(() => { fetchGroupData(); }, [fetchGroupData]);

  const handleSubmitClue = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/groups/${groupId}/clues`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newClue, answer: newAnswer }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to submit clue');
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
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to submit solution');
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
    <main className="max-w-4xl mx-auto px-4 py-8 text-black font-mono">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 mb-6 rounded text-sm">
          <div className="flex justify-between items-center">
            <span>{error}</span>
            <button onClick={() => setError('')} className="underline">Dismiss</button>
          </div>
        </div>
      )}

      {group && (
        <div className="mb-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <h1 className="text-3xl font-bold">{group.name}</h1>
            <div className="text-sm mt-2 md:mt-0">
              <span className="mr-2 text-gray-500">Code:</span>
              <span className="bg-gray-100 px-3 py-1 rounded">{showCode ? group.code : '••••••'}</span>
              <button onClick={() => setShowCode(!showCode)} className="ml-2 underline text-black text-xs">
                {showCode ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex space-x-6 border-b border-gray-200 mb-6">
        {['clues', 'create', 'leaderboard'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-2 font-semibold ${activeTab === tab ? 'border-b-2 border-black text-black' : 'text-gray-500 hover:text-black'}`}
          >
            {tab === 'clues' ? 'Solve Clues' : tab === 'create' ? 'Submit Clue' : 'Leaderboard'}
          </button>
        ))}
      </div>

      {activeTab === 'create' && (
        <section>
          <h2 className="text-xl font-bold mb-4">Create a New Clue</h2>
          <form onSubmit={handleSubmitClue} className="space-y-4">
            <input
              type="text"
              value={newClue}
              onChange={(e) => setNewClue(e.target.value)}
              placeholder="Clue text"
              className="w-full border border-gray-300 px-4 py-2 rounded"
              required
            />
            <input
              type="text"
              value={newAnswer}
              onChange={(e) => setNewAnswer(e.target.value)}
              placeholder="Answer"
              className="w-full border border-gray-300 px-4 py-2 rounded"
              required
            />
            <button type="submit" className="bg-black text-white px-4 py-2 rounded hover:opacity-90">
              Submit
            </button>
          </form>
        </section>
      )}

      {activeTab === 'clues' && (
        <div className="grid md:grid-cols-3 gap-6">
          <aside className="space-y-2">
            <h3 className="text-lg font-semibold">Clues</h3>
            {clues.length === 0 ? (
              <p className="text-gray-400 text-sm italic">No clues yet.</p>
            ) : (
              clues.map(clue => (
                <button
                  key={clue.id}
                  onClick={() => selectClue(clue)}
                  className={`block w-full text-left px-4 py-2 rounded hover:bg-gray-100 ${
                    currentClue?.id === clue.id ? 'bg-gray-100 border-l-4 border-black' : ''
                  }`}
                >
                  <div className="flex justify-between">
                    <span className="truncate">{clue.text}</span>
                    {clue.solutions.some(s => s.correct) && <span className="text-green-500">✓</span>}
                  </div>
                  <p className="text-xs text-gray-500">by {clue.author.name}</p>
                </button>
              ))
            )}
          </aside>

          <section className="md:col-span-2">
            {currentClue ? (
              <div>
                <div className="mb-2 text-sm text-gray-500">by {currentClue.author.name}</div>
                <h3 className="text-2xl font-bold mb-4">{currentClue.text}</h3>

                {currentClue.solutions.some(s => s.correct) || showClueAnswer ? (
                  <div className="flex gap-2 mb-4">
                    {currentClue.answer.toUpperCase().split('').map((char, idx) => (
                      <span key={idx} className="w-10 h-10 border border-black rounded flex items-center justify-center text-lg font-bold uppercase">
                        {char}
                      </span>
                    ))}
                  </div>
                ) : (
                  <>
                    <input
                      type="text"
                      value={solutions[currentClue.id] || ''}
                      onChange={(e) => setSolutions(prev => ({ ...prev, [currentClue.id]: e.target.value.toUpperCase() }))}
                      className="w-full border border-gray-300 px-4 py-2 mb-4 rounded uppercase"
                      placeholder="Type your answer"
                    />
                    <div className="flex gap-4">
                      <button
                        onClick={() => handleSubmitSolution(currentClue.id)}
                        className="bg-black text-white px-4 py-2 rounded disabled:opacity-50"
                        disabled={!solutions[currentClue.id]}
                      >
                        Check Answer
                      </button>
                      <button onClick={() => setShowClueAnswer(true)} className="underline text-sm text-gray-600">
                        Reveal Answer
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">Select a clue to solve.</p>
            )}
          </section>
        </div>
      )}

      {activeTab === 'leaderboard' && (
        <section>
          <h2 className="text-xl font-bold mb-4">Leaderboard</h2>
          {members.length === 0 ? (
            <p className="text-gray-400 italic">No members yet</p>
          ) : (
            <ul className="space-y-2">
              {members.sort((a, b) => b.score - a.score).map((member, i) => (
                <li key={member.id} className="flex justify-between items-center bg-gray-50 px-4 py-2 rounded">
                  <div className="flex items-center space-x-3">
                    <span className="w-6 h-6 flex items-center justify-center bg-gray-200 rounded-full text-sm">{i + 1}</span>
                    <span>{member.name}</span>
                  </div>
                  <span className="font-bold">{member.score} pts</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </main>
  );
}
