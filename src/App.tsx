import React from 'react';
import { useTeamStore } from './stores/teamStore';
import { TeamMemberCard } from './components/TeamMemberCard';
import { TeamMemberForm } from './components/TeamMemberForm';
import { OptimisticUIMonitor } from './components/OptimisticUIMonitor';
import { TeamMember } from './types/team';

function App() {
  const members = useTeamStore((state) => state.members);
  const optimisticUpdates = useTeamStore((state) => state.optimisticUpdates);
  const addMember = useTeamStore((state) => state.addMember);
  const updateMember = useTeamStore((state) => state.updateMember);

  const [showForm, setShowForm] = React.useState(false);
  const [editingMember, setEditingMember] = React.useState<TeamMember | null>(null);
  const [searchTerm, setSearchTerm] = React.useState('');

  const handleSubmit = async (data: Omit<TeamMember, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingMember) {
      await updateMember(editingMember.id, data);
    } else {
      await addMember(data);
    }
  };

  const handleEdit = (member: TeamMember) => {
    setEditingMember(member);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingMember(null);
  };

  const filteredMembers = members.filter(
    (member) =>
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Team Management</h1>
          <p className="text-gray-600">Advanced optimistic UI with predictive analytics and intelligent rollback</p>
        </div>
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input type="text" placeholder="Search team members..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm" />
          </div>
          <button onClick={() => setShowForm(true)} className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-md transition-colors">➕ Add Team Member</button>
        </div>
        <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow p-4"><div className="text-sm text-gray-600 mb-1">Total Members</div><div className="text-2xl font-bold text-gray-900">{members.length}</div></div>
          <div className="bg-white rounded-lg shadow p-4"><div className="text-sm text-gray-600 mb-1">Active</div><div className="text-2xl font-bold text-green-600">{members.filter((m) => m.status === 'active').length}</div></div>
          <div className="bg-white rounded-lg shadow p-4"><div className="text-sm text-gray-600 mb-1">Pending Updates</div><div className="text-2xl font-bold text-blue-600">{optimisticUpdates.length}</div></div>
        </div>
        {filteredMembers.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="text-gray-400 text-6xl mb-4">👥</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">{searchTerm ? 'No members found' : 'No team members yet'}</h3>
            <p className="text-gray-500 mb-6">{searchTerm ? 'Try adjusting your search criteria' : 'Get started by adding your first team member'}</p>
            {!searchTerm && (<button onClick={() => setShowForm(true)} className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors">Add First Member</button>)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMembers.map((member) => {
              const optimisticUpdate = optimisticUpdates.find((u) => u.data.id === member.id);
              return (<TeamMemberCard key={member.id} member={member} isOptimistic={!!optimisticUpdate} confidence={optimisticUpdate?.confidence} onEdit={handleEdit} />);
            })}
          </div>
        )}
      </div>
      {showForm && (<TeamMemberForm member={editingMember} onSubmit={handleSubmit} onCancel={handleCloseForm} />)}
      <OptimisticUIMonitor />
    </div>
  );
}

export default App;