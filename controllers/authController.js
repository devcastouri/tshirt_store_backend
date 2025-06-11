const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client with service role key for admin operations
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase configuration. Please check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// List all users (admin only)
const listUsers = async (req, res) => {
  try {
    // First verify the requesting user is an admin
    const { data: { user }, error: userError } = await supabase.auth.getUser(req.headers.authorization.split(' ')[1]);
    
    if (userError) {
      console.error('Auth error:', userError);
      return res.status(401).json({ 
        message: 'Authentication failed',
        error: userError.message 
      });
    }

    // Get user's role from our database
    const { data: userData, error: roleError } = await supabase
      .from('users')
      .select('role')
      .eq('email', user.email)
      .single();

    if (roleError || !userData || userData.role !== 'admin') {
      return res.status(403).json({ 
        message: 'Access denied. Admin privileges required.' 
      });
    }

    // If user is admin, proceed with listing users
    const { data: users, error } = await supabase.auth.admin.listUsers();
    
    if (error) {
      console.error('Error listing users:', error);
      return res.status(500).json({ 
        message: 'Failed to list users',
        error: error.message 
      });
    }

    // Get roles for all users
    const { data: userRoles, error: rolesError } = await supabase
      .from('users')
      .select('email, role');

    if (rolesError) {
      console.error('Error fetching user roles:', rolesError);
      return res.status(500).json({ 
        message: 'Failed to fetch user roles',
        error: rolesError.message 
      });
    }

    // Combine user data with roles
    const usersWithRoles = users.users.map(user => ({
      ...user,
      role: userRoles.find(ur => ur.email === user.email)?.role || 'user'
    }));

    res.json({ users: usersWithRoles });
  } catch (error) {
    console.error('Error in listUsers:', error);
    res.status(500).json({ 
      message: 'Failed to list users',
      error: error.message 
    });
  }
};

// Get current user
const getCurrentUser = async (req, res) => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser(req.headers.authorization.split(' ')[1]);

    if (error) {
      console.error('Auth error:', error);
      return res.status(401).json({ 
        message: 'Authentication failed',
        error: error.message 
      });
    }

    if (!user) {
      return res.status(404).json({ 
        message: 'User not found' 
      });
    }

    // Get additional user data from the database using email
    const { data: userData, error: dbError } = await supabase
      .from('users')
      .select('*')
      .eq('email', user.email)
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return res.status(500).json({ 
        message: 'Failed to get user data',
        error: dbError.message 
      });
    }

    // If user exists in auth but not in our users table, create them
    if (!userData) {
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert([
          {
            email: user.email,
            role: 'admin' // Default to admin for now
          }
        ])
        .select()
        .single();

      if (insertError) {
        console.error('Insert error:', insertError);
        return res.status(500).json({ 
          message: 'Failed to create user record',
          error: insertError.message 
        });
      }

      return res.json({ 
        user: {
          ...user,
          ...newUser
        }
      });
    }

    res.json({ 
      user: {
        ...user,
        ...userData
      }
    });
  } catch (error) {
    console.error('Error getting current user:', error);
    res.status(500).json({ 
      message: 'Failed to get current user',
      error: error.message 
    });
  }
};

// Register a new user
const register = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

    if (authError) {
      console.error('Auth error:', authError);
      return res.status(400).json({ 
        message: 'Failed to create user',
        error: authError.message 
      });
    }

    // Create user record in our database
    const { data: userData, error: dbError } = await supabase
      .from('users')
      .insert([
        {
          email,
          role: 'user'
        }
      ])
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return res.status(500).json({ 
        message: 'Failed to create user record',
        error: dbError.message 
      });
    }

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        ...authData.user,
        ...userData
      }
    });
  } catch (error) {
    console.error('Error in register:', error);
    res.status(500).json({ 
      message: 'Failed to register user',
      error: error.message 
    });
  }
};

// Login user
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Sign in with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError) {
      console.error('Auth error:', authError);
      return res.status(401).json({ 
        message: 'Invalid credentials',
        error: authError.message 
      });
    }

    // Get user data from our database
    const { data: userData, error: dbError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return res.status(500).json({ 
        message: 'Failed to get user data',
        error: dbError.message 
      });
    }

    // If user doesn't exist in our database, create them
    if (!userData) {
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert([
          {
            email,
            role: 'admin' // Default to admin for now
          }
        ])
        .select()
        .single();

      if (insertError) {
        console.error('Insert error:', insertError);
        return res.status(500).json({ 
          message: 'Failed to create user record',
          error: insertError.message 
        });
      }

      return res.json({
        message: 'Login successful',
        user: {
          ...authData.user,
          ...newUser
        },
        token: authData.session.access_token
      });
    }

    res.json({
      message: 'Login successful',
      user: {
        ...authData.user,
        ...userData
      },
      token: authData.session.access_token
    });
  } catch (error) {
    console.error('Error in login:', error);
    res.status(500).json({ 
      message: 'Failed to login',
      error: error.message 
    });
  }
};

// Logout user
const logout = async (req, res) => {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Logout error:', error);
      return res.status(500).json({ 
        message: 'Failed to logout',
        error: error.message 
      });
    }

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Error in logout:', error);
    res.status(500).json({ 
      message: 'Failed to logout',
      error: error.message 
    });
  }
};

module.exports = {
  listUsers,
  getCurrentUser,
  register,
  login,
  logout
}; 