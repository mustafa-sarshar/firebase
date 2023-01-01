// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signOut,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  unlink,
} from "firebase/auth";

import firebaseConfig from "./.configs";

(function initApp() {
  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  // Init Services
  const db = getFirestore(app);
  // Collection Ref
  const COLLECTION_NAME = "Books";
  const colRef = collection(db, COLLECTION_NAME);
  // Define a query
  const q = query(colRef, orderBy("createdAt", "desc"));

  // DOM Elements
  const overlayEl = document.querySelector("#overlay");
  const addFormEl = document.querySelector(".addForm");
  const updateFormEl = document.querySelector(".updateForm");
  const deleteFormEl = document.querySelector(".deleteForm");
  const signUpFormEl = document.querySelector(".signUpForm");
  const signInFormEl = document.querySelector(".signInForm");
  const btnSignOutEl = document.querySelector("#btnSignOut");
  const btnSignOutFromFirebaseEl = document.querySelector(
    "#btnSignOutFromFirebase"
  );
  const divSignOutEl = document.querySelector(".divSignOut");
  const lblCurrentUserEl = document.querySelector("#lblCurrentUser");
  const bookListEl = document.querySelector(".bookList");
  const btnUnsubscribeAllEl = document.querySelector("#btnUnsubscribeAll");
  const btnSubscribeAllEl = document.querySelector("#btnSubscribeAll");

  // Define subscriptions
  let unsubSnapshotAll;
  let unsubSnapshotDoc = {};
  let unsubAuth;

  // Get Collection Data
  const getDataAll = () => {
    getDocs(q)
      .then((snapshot) => {
        const books = [];
        snapshot.docs.forEach((doc) => {
          books.push({ id: doc.id, ...doc.data() });
        });
        console.log(books);
        loadAllBooks(books);
      })
      .catch((err) => {
        console.error(err);
      });
  };

  // Get a single doc
  const getData = (bookId) => {
    const docRef = doc(db, COLLECTION_NAME, bookId);
    unsubSnapshotDoc[bookId] = getDoc(docRef)
      .then((doc) => {
        console.log("Here", doc.data(), doc.id);
      })
      .catch((err) => {
        console.error(err.message);
      });
  };

  // Set Snapshot (All Data)
  const setSnapshotAll = () => {
    unsubSnapshotAll = onSnapshot(q, (snapshot) => {
      const books = [];
      snapshot.docs.forEach((doc) => {
        books.push({ id: doc.id, ...doc.data() });
      });
      loadAllBooks(books);
    });
  };

  // Set Snapshot (Single Doc)
  const setSnapshot = (bookId) => {
    const docRef = doc(db, COLLECTION_NAME, bookId);

    unsubSnapshotDoc[bookId] = onSnapshot(docRef, (doc) => {
      const bookData = doc.data();
      console.log(`The book "${bookData.title}" is updated!`);
    });
  };

  const loadAllBooks = (bookList) => {
    bookListEl.textContent = "";

    bookList.forEach((book) => {
      const listEl = createBookListItem({ ...book });
      bookListEl.appendChild(listEl);

      // set snapshot for each book
      setSnapshot(book.id);
    });
  };

  const createBookListItem = (bookData) => {
    const { id: bookId, title, author } = bookData;
    const listEl = document.createElement("li");
    const boldEl = document.createElement("b");

    boldEl.textContent = title;
    listEl.appendChild(boldEl);

    listEl.addEventListener("click", (evt) => {
      updateFormEl.bookId.value = bookId;
      updateFormEl.title.value = title;
      updateFormEl.author.value = author;
      deleteFormEl.bookId.value = bookId;
    });
    listEl.addEventListener("dblclick", async (evt) => {
      showModal({ ...bookData });
    });

    return listEl;
  };

  // Modal
  overlayEl.addEventListener("click", (evt) => {
    overlayEl.classList.remove("show");
    overlayEl.classList.add("hide");
  });

  const showModal = (bookData) => {
    const modalEl = createModal({ ...bookData });
    overlayEl.innerHTML = "";
    overlayEl.classList.remove("overlay");
    overlayEl.appendChild(modalEl);

    overlayEl.classList.add("overlay");
    overlayEl.classList.add("show");
    overlayEl.classList.remove("hide");
  };

  const createModal = (bookData) => {
    const { title, author, createdAt, updatedAt } = bookData;
    let dateTimeCreatedAt,
      dateTimeUpdatedAt = "";
    if (createdAt) {
      dateTimeCreatedAt = new Date(createdAt.seconds * 1000);
      dateTimeCreatedAt = `${dateTimeCreatedAt.toLocaleTimeString()} on ${dateTimeCreatedAt.toLocaleDateString()}`;
    }
    if (updatedAt) {
      dateTimeUpdatedAt = new Date(updatedAt.seconds * 1000);
      dateTimeUpdatedAt = `${dateTimeUpdatedAt.toLocaleTimeString()} on ${dateTimeUpdatedAt.toLocaleDateString()}`;
    }

    const modalDivEl = document.createElement("div");
    const bookTitleEl = document.createElement("h2");
    const authorEl = document.createElement("p");
    const createdAtEl = document.createElement("small");
    const updatedAtEl = document.createElement("small");
    const breakEl = document.createElement("br");

    bookTitleEl.textContent = title;
    authorEl.textContent = `- written by ${author}`;
    createdAtEl.textContent = `created at: ${dateTimeCreatedAt}`;
    updatedAtEl.textContent = `modified at: ${dateTimeUpdatedAt}`;

    modalDivEl.appendChild(bookTitleEl);
    modalDivEl.appendChild(authorEl);
    modalDivEl.appendChild(createdAtEl);
    modalDivEl.appendChild(breakEl);
    if (updatedAt) {
      modalDivEl.appendChild(updatedAtEl);
    }

    modalDivEl.classList.add("modal");
    return modalDivEl;
  };

  // Sign Up
  signUpFormEl.addEventListener("submit", (evt) => {
    evt.preventDefault();

    const emailEntered = evt.target.email.value;
    const passwordEntered = evt.target.password.value;

    createUserWithEmailAndPassword(auth, emailEntered, passwordEntered)
      .then((cred) => {
        console.log("user signed up:", cred.user);
        evt.target.reset();
      })
      .catch((err) => {
        console.error(err.message);
      })
      .finally(() => {});
  });

  // Sign In
  signInFormEl.addEventListener("submit", (evt) => {
    evt.preventDefault();

    const emailEntered = evt.target.email.value;
    const passwordEntered = evt.target.password.value;

    signInWithEmailAndPassword(auth, emailEntered, passwordEntered)
      .then((cred) => {
        console.log("user signed in:", cred.user);
        evt.target.reset();
      })
      .catch((err) => {
        console.error(err.message);
      })
      .finally(() => {});
  });

  // Sign Out
  btnSignOutEl.addEventListener("click", (evt) => {
    const { currentUser } = auth;

    if (currentUser) {
      signOut(auth)
        .then(() => {})
        .catch((err) => {
          console.error(err.message);
        })
        .finally(() => {});
    }
  });

  // Sign Out from Firebase
  btnSignOutFromFirebaseEl.addEventListener("click", (evt) => {
    const { currentUser } = auth;

    if (currentUser) {
    }
  });

  // Update Current User
  const updateCurrentUser = () => {
    const { currentUser } = auth;
    if (currentUser) {
      lblCurrentUserEl.innerHTML = `Signed in via<br />${currentUser.email}`;
      divSignOutEl.classList.add("userSignedIn");
    } else {
      lblCurrentUserEl.textContent = "No user signed in!";
      divSignOutEl.classList.remove("userSignedIn");
    }
  };

  const setOnAuthChangeListener = () => {
    unsubAuth = onAuthStateChanged(auth, (user) => {
      updateCurrentUser();
    });
  };

  // Add Book
  addFormEl.addEventListener("submit", (evt) => {
    evt.preventDefault();

    const titleEntered = evt.target.title.value;
    const authorEntered = evt.target.author.value;
    addDoc(colRef, {
      title: titleEntered,
      author: authorEntered,
      createdAt: serverTimestamp(),
      updatedAt: null,
    })
      .then(() => {
        evt.target.reset();
        evt.target.title.focus();
        // getDataAll();
      })
      .catch((err) => {
        alert(err.message);
      });
  });

  // Update Book
  updateFormEl.addEventListener("submit", (evt) => {
    evt.preventDefault();

    const bookIdEntered = evt.target.bookId.value;
    const docRef = doc(db, COLLECTION_NAME, bookIdEntered);

    const titleEntered = evt.target.title.value;
    const authorEntered = evt.target.author.value;

    updateDoc(docRef, {
      title: titleEntered,
      author: authorEntered,
      updatedAt: serverTimestamp(),
    })
      .then(() => {
        evt.target.reset();
        // getDataAll();
      })
      .catch((err) => {
        alert(err.message);
      });
  });

  // Delete Book
  deleteFormEl.addEventListener("submit", async (evt) => {
    evt.preventDefault();

    const bookIdEntered = evt.target.bookId.value;
    const docRef = doc(db, COLLECTION_NAME, bookIdEntered);

    // Unsubscribe the Doc before deleting it from the db
    await unsubSnapshotDoc[bookIdEntered]();
    await deleteDoc(docRef)
      .then(() => {
        evt.target.reset();
        // getDataAll();
      })
      .catch((err) => {
        alert("Something went wrong!\nError:" + err.message);
      });
  });

  // Unsubscribe from all listeners
  btnUnsubscribeAllEl.addEventListener("click", (evt) => {
    if (unsubSnapshotAll) {
      unsubSnapshotAll();
    }
    if (Object.entries(unsubSnapshotDoc).length > 0) {
      const unsubSnaps = Object.values(unsubSnapshotDoc);
      unsubSnaps.forEach((unsubSnap) => unsubSnap());
    }
    if (unsubAuth) {
      unsubAuth();
    }
  });

  // Subscribe to all listeners
  btnSubscribeAllEl.addEventListener("click", (evt) => {
    setSnapshotAll();
    setOnAuthChangeListener();
  });

  // Init App
  // getDataAll();
  setSnapshotAll();
  setOnAuthChangeListener();

  console.log("App is initialized!");
})();
