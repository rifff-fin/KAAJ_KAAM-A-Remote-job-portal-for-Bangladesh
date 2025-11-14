import React, { useEffect, useState } from 'react';
import API from '../api';
import { Link } from 'react-router-dom';

export default function ClientDashboard() {
  const [jobs, setJobs] = useState([]);

  useEffect(() => {
    API.get('/jobs/my')
      .then(res => setJobs(res.data))
      .catch(err => console.error(err));
  }, []);

  const hire = async (jobId, freelancerId) => {
    await API.post(`/jobs/${jobId}/hire`, { freelancerId });
    window.location.reload();
  };

  const unhire = async (jobId) => {
    await API.post(`/jobs/${jobId}/unhire`);
    window.location.reload();
  };

  const openChat = (freelancerId) => {
    window.location.href = `/chat?with=${freelancerId}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-4xl font-bold text-gray-800">My Job Posts</h1>
          <Link
            to="/post-job"
            className="bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 transition text-lg font-medium"
          >
            + Post New Job
          </Link>
        </div>

        {/* If no jobs */}
        {jobs.length === 0 ? (
          <p className="text-center text-gray-600 py-20">You haven't posted any jobs yet.</p>
        ) : (
          <div className="space-y-6">
            {jobs.map(job => (
              <div key={job._id} className="bg-white rounded-2xl shadow-lg p-6">

                {/* Job Header */}
                <h3 className="text-2xl font-bold text-gray-800">{job.title}</h3>
                <p className="text-gray-600 mt-1">
                  Budget: ৳{job.budget} • Deadline: {job.deadline}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Status: <strong>{job.status}</strong>
                </p>

                {/* Applicants */}
                <div className="mt-6">
                  <p className="font-semibold text-lg">
                    Applicants ({job.interests?.length || 0})
                  </p>

                  {job.interests.length === 0 && (
                    <p className="text-sm text-gray-500 mt-2">No freelancers applied yet.</p>
                  )}

                  {job.interests.map(int => (
                    <div
                      key={int.freelancer._id}
                      className="flex justify-between items-center mt-3 p-4 bg-gray-50 rounded-xl shadow-sm"
                    >
                      <div>
                        <p className="font-medium text-gray-800">
                          {int.freelancer.profile?.name || 'Freelancer'}
                        </p>
                        <p className="text-sm text-gray-500">
                          Skill: {int.freelancer.profile?.skills || 'N/A'}
                        </p>
                      </div>

                      <div className="flex gap-3">
                        {/* Chat */}
                        <button
                          onClick={() => openChat(int.freelancer._id)}
                          className="text-blue-600 text-sm hover:underline"
                        >
                          Message
                        </button>

                        {/* Hire */}
                        {!job.hiredFreelancer && (
                          <button
                            onClick={() => hire(job._id, int.freelancer._id)}
                            className="bg-green-600 text-white text-sm px-4 py-1.5 rounded-lg hover:bg-green-700"
                          >
                            Hire
                          </button>
                        )}

                        {/* Unhire */}
                        {job.hiredFreelancer === int.freelancer._id && (
                          <button
                            onClick={() => unhire(job._id)}
                            className="bg-red-600 text-white text-sm px-4 py-1.5 rounded-lg hover:bg-red-700"
                          >
                            Unhire
                          </button>
                        )}
                      </div>

                    </div>
                  ))}
                </div>

              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
