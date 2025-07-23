// SWR fetcher function


const getBaseUrl = () => {
    if (typeof window !== 'undefined') {
        return process.env.NEXT_PUBLIC_API_BASE_URL || '';
    }
    return process.env.NEXT_PUBLIC_API_BASE_URL || '';
};

const buildUrl = (url) => {
    if (url.startsWith('/api/')) {
        return getBaseUrl() + url;
    }
    return url;
};


function getAuthHeaders(options = {}) {
    let token = null;
    if (typeof window !== 'undefined') {
        token = localStorage.getItem('access_token');
    }
    return token
        ? { ...options.headers, Authorization: `Bearer ${token}` }
        : { ...options.headers };
}

const getFetcher = (url, options = {}) => {
    // Nếu chưa có token (chưa đăng nhập), không gọi API nữa
    let token = null;
    if (options.token) token = options.token;
    else if (typeof window !== 'undefined') token = localStorage.getItem('access_token');
    if (!token) return Promise.resolve(null);
    return fetch(buildUrl(url), {
        method: "GET",
        headers: { 'browserrefreshed': 'false', ...getAuthHeaders({ ...options, token }) },
        ...options
    }).then((res) => {
        if (!res.ok) {
            throw new Error("Failed to fetch the data")
        }
        return res.json()
    });
};


const postFetcher = (url, arg, options = {}) => {
    let token = null;
    if (options.token) token = options.token;
    else if (typeof window !== 'undefined') token = localStorage.getItem('access_token');
    if (!token) return Promise.resolve(null);
    return fetch(buildUrl(url), {
        method: "POST",
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders({ ...options, token }) },
        body: JSON.stringify(arg),
        ...options
    }).then((res) => {
        if (!res.ok) {
            throw new Error("Failed to post data")
        }
        return res.json()
    });
};

const putFetcher = (url, arg, options = {}) => {
    let token = null;
    if (options.token) token = options.token;
    else if (typeof window !== 'undefined') token = localStorage.getItem('access_token');
    if (!token) return Promise.resolve(null);
    return fetch(buildUrl(url), {
        method: "PUT",
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders({ ...options, token }) },
        body: JSON.stringify(arg),
        ...options
    }).then((res) => {
        if (!res.ok) {
            throw new Error("Failed to updated data")
        }
        return res.json()
    });
};

const patchFetcher = (url, arg, options = {}) => {
    let token = null;
    if (options.token) token = options.token;
    else if (typeof window !== 'undefined') token = localStorage.getItem('access_token');
    if (!token) return Promise.resolve(null);
    return fetch(buildUrl(url), {
        method: "PATCH",
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders({ ...options, token }) },
        body: JSON.stringify(arg),
        ...options
    }).then((res) => {
        if (!res.ok) {
            throw new Error("Failed to updated data")
        }
        return res.json()
    });
};

const deleteFetcher = (url, arg, options = {}) => {
    let token = null;
    if (options.token) token = options.token;
    else if (typeof window !== 'undefined') token = localStorage.getItem('access_token');
    if (!token) return Promise.resolve(null);
    return fetch(buildUrl(url), {
        method: "DELETE",
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders({ ...options, token }) },
        body: JSON.stringify(arg),
        ...options
    }).then((res) => {
        if (!res.ok) {
            throw new Error("Failed to delete data")
        }
        return res.json()
    });
};

export { getFetcher, postFetcher, putFetcher, deleteFetcher, patchFetcher }