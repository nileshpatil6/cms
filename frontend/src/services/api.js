const API_BASE_URL = 'http://localhost:8000'; // Assuming backend runs on port 8000

const getAuthHeaders = () => {
  const token = localStorage.getItem('accessToken');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

export const registerUser = async (email, password) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.detail || 'Failed to register');
    }
    return data;
  } catch (error) {
    console.error('Error in registerUser:', error);
    throw error;
  }
};

export const loginUser = async (email, password) => {
  try {
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);

    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.detail || 'Login failed');
    }
    return data;
  } catch (error) {
    console.error('Error in loginUser:', error);
    throw error;
  }
};

export const submitComplaint = async (complaintData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/complaints/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(complaintData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to submit complaint');
    }

    const data = await response.json();
    return data; // includes ticket_number
  } catch (error) {
    console.error('Error in submitComplaint:', error);
    throw error;
  }
};

export const getComplaints = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/complaints/`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to fetch complaints');
    }
    const data = await response.json();
    return data; // includes ticket_number
  } catch (error) {
    console.error('Error in getComplaints:', error);
    throw error;
  }
};

export const updateComplaintStatus = async (complaintId, newStatus) => {
  try {
    const response = await fetch(`${API_BASE_URL}/complaints/${complaintId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ status: newStatus }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to update complaint status');
    }
    return await response.json();
  } catch (error) {
    console.error('Error in updateComplaintStatus:', error);
    throw error;
  }
};

export const triggerAIAnalysis = async (complaintId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/ai/process-complaint/${complaintId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to trigger AI analysis');
    }
    return await response.json();
  } catch (error) {
    console.error('Error in triggerAIAnalysis:', error);
    throw error;
  }
};

export const getUserDetails = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/users/me`, {
      headers: getAuthHeaders(),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.detail || 'Failed to fetch user details');
    }
    return data;
  } catch (error) {
    console.error('Error in getUserDetails:', error);
    throw error;
  }
};