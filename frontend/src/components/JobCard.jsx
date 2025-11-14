const JobCard = ({ job }) => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [message, setMessage] = useState('');

  const apply = async () => {
    await API.post(`/jobs/${job._id}/interest`, { message }); // ← NO /api
    alert('Interest sent!');
  };

  return (
    <div className="border p-4 rounded-lg">
      <h3 className="font-bold">{job.title}</h3>
      <p>{job.description}</p>
      <p className="text-green-600 font-bold">৳{job.budget}</p>
      {user.role === 'seller' && !job.interests.some(i => i.freelancer._id === user.id) && (
        <div className="mt-2">
          <textarea placeholder="Why should you be hired?" value={message}
            onChange={e => setMessage(e.target.value)} className="w-full p-2 border rounded" />
          <button onClick={apply} className="mt-1 bg-blue-600 text-white px-3 py-1 rounded">
            Show Interest
          </button>
        </div>
      )}
    </div>
  );
};