import pool from '../config/db.js';

// insert into database
export const insert = async (firstName, lastName, email, username, password, role) => {
    const [result] = await pool.query(
        "INSERT INTO user_account (first_name, last_name, email, username, password, role) VALUES (?, ?, ?, ?, ?, ?)",
        [firstName, lastName, email, username, password, role]
    );
    return result.insertId;
}

// find by email — for login and duplicate check
export const findUserByEmail = async (email) => {
    const [rows] = await pool.query(
        "SELECT * FROM user_account WHERE email = ?",
        [email]
    );
    return rows;
}

// find by username — for duplicate check on register
export const findUserByUsername = async (username) => {
    const [rows] = await pool.query(
        "SELECT * FROM user_account WHERE username = ?",
        [username]
    );
    return rows;
}

// find by primary key
export const findUserById = async (id) => {
    const [rows] = await pool.query(
        "SELECT account_id, first_name, last_name, email, username, role, created_at FROM user_account WHERE account_id = ?",
        [id]
    );
    return rows;
}
