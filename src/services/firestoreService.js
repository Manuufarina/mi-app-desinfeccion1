import {
    collection,
    setDoc,
    query,
    where,
    doc,
    updateDoc,
    deleteDoc,
    getDoc,
    getDocs,
    addDoc,
    orderBy,
    Timestamp,
    onSnapshot
} from 'firebase/firestore';
import {
    ref as storageRef,
    uploadBytes,
    getDownloadURL
} from "firebase/storage";
import { db, storage } from './firebase'; // Import db and storage from your firebase.js
import { VALOR_METRO_CUBICO_DEFAULT, DIAS_VIGENCIA_TIPO } from '../theme'; // Import constants

// Note: appId will need to be passed to functions or imported if centralized.
// For now, functions that need it will accept it as a parameter.

export const uploadFileToStorage = async (file, path) => {
    if (!file) return null;
    const fileRef = storageRef(storage, path);
    await uploadBytes(fileRef, file);
    return await getDownloadURL(fileRef);
};

export const handleUpdateValorMetroCubico = async (configCollectionPath, configDocId, nuevoValor) => {
    const valorNumerico = parseFloat(nuevoValor);
    if (isNaN(valorNumerico) || valorNumerico <= 0) {
        throw new Error("El valor por m³ debe ser un número positivo.");
    }

    const ref = configDocId ? doc(db, configCollectionPath, configDocId) : doc(collection(db, configCollectionPath));
    await setDoc(ref, { clave: "valorMetroCubico", valor: valorNumerico }, { merge: !configDocId });
    return { updatedValor: valorNumerico, newConfigDocId: ref.id };
};

export const fetchInitialConfig = (configCollectionPath, callback) => { // VALOR_METRO_CUBICO_DEFAULT is imported now
    const configRef = collection(db, configCollectionPath);
    const q = query(configRef, where("clave", "==", "valorMetroCubico"));

    return onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
            const configData = snapshot.docs[0].data();
            callback({
                valor: parseFloat(configData.valor) || VALOR_METRO_CUBICO_DEFAULT, // Use imported constant
                docId: snapshot.docs[0].id
            });
        } else {
            const defaultConfigRef = doc(configRef);
            setDoc(defaultConfigRef, { clave: "valorMetroCubico", valor: VALOR_METRO_CUBICO_DEFAULT }) // Use imported constant
                .then(() => callback({ valor: VALOR_METRO_CUBICO_DEFAULT, docId: defaultConfigRef.id })) // Use imported constant
                .catch(err => {
                    console.error("Error creating default config: ", err);
                    callback({ error: "Error creando configuración por defecto." });
                });
        }
    }, (error) => {
        console.error("Error loading configuration: ", error);
        callback({ error: "Error al cargar configuración de precios." });
    });
};

export const fetchAllVehicles = (vehiclesCollectionPath, callback) => {
    const q = query(collection(db, vehiclesCollectionPath));
    return onSnapshot(q, (snap) => {
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        callback({ data });
    }, (error) => {
        console.error("Vehicle Fetch Error: ", error);
        callback({ error: "Error al cargar vehículos." });
    });
};

export const handleRegisterVehicle = async (vehiclesCollectionPath, vehicleData, currentUserUid) => {
    const plateId = vehicleData.patente.toUpperCase();
    const docRef = doc(collection(db, vehiclesCollectionPath), plateId);
    if ((await getDoc(docRef)).exists()) {
        throw new Error("Patente ya registrada.");
    }

    const m3Num = parseFloat(vehicleData.metrosCubicos);
    if (isNaN(m3Num) || m3Num <= 0) {
        throw new Error("Metros cúbicos inválidos.");
    }

    const dataToSave = {
        ...vehicleData, // Spread first to include all fields from form
        patente: vehicleData.patente.toUpperCase(), // Then overwrite/ensure specific fields
        propietarioEmail: vehicleData.propietarioEmail || '', // Add/ensure propietarioEmail
        metrosCubicos: m3Num,
        fechaCreacion: Timestamp.now(),
        historialDesinfecciones: [],
        createdBy: currentUserUid,
        fechaVencimiento: null
    };
    await setDoc(docRef, dataToSave);
    return { id: docRef.id, ...dataToSave };
};

export const handleUpdateVehicle = async (vehiclesCollectionPath, vehicleId, updatedData) => {
    const vehicleRef = doc(db, vehiclesCollectionPath, vehicleId);
    await updateDoc(vehicleRef, {
        ...updatedData,
        patente: updatedData.patente.toUpperCase(),
        metrosCubicos: parseFloat(updatedData.metrosCubicos) || 0
    });
    const snap = await getDoc(vehicleRef);
    return { id: snap.id, ...snap.data() };
};

// handleSearchVehicle is a local filter, so it might stay in App.js or be moved if it involves backend search later.
// For now, assuming it's a local filter based on allVehiclesForDashboard, it doesn't need to be in firestoreService.js
// If it were to query Firestore directly, it would be here.

export const handleSelectVehicleForDetail = async (vehiclesCollectionPath, vehicleId) => {
    const docSnap = await getDoc(doc(db, vehiclesCollectionPath, vehicleId));
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
    } else {
        throw new Error("Vehículo no encontrado.");
    }
};

export const handleAddDisinfection = async (vehiclesCollectionPath, vehicleId, disinfectionData, reciboFile, transaccionFile, currentUserUid, appId) => {
    const vehicleRef = doc(db, vehiclesCollectionPath, vehicleId);
    const vehicleSnap = await getDoc(vehicleRef);

    if (!vehicleSnap.exists()) {
        throw new Error("Vehículo no encontrado.");
    }

    const vehicle = vehicleSnap.data();

    // Validate no duplicate disinfection in the same month
    const newDateObj = new Date(disinfectionData.fechaDesinfeccion + "T00:00:00");
    const month = newDateObj.getMonth();
    const year = newDateObj.getFullYear();
    const alreadyExists = (vehicle.historialDesinfecciones || []).some(d => {
        const existingDate = d.fecha.toDate ? d.fecha.toDate() : new Date(d.fecha);
        return existingDate.getFullYear() === year && existingDate.getMonth() === month;
    });
    if (alreadyExists) {
        throw new Error('Ya existe una desinfección registrada para este mes.');
    }

    const timestamp = Date.now();
    // Path for storage now needs appId if it's part of the path structure
    const reciboPath = reciboFile ? `recibos/${appId}/${vehicleId}/${timestamp}_${reciboFile.name}` : null;
    const transaccionPath = transaccionFile ? `transacciones/${appId}/${vehicleId}/${timestamp}_${transaccionFile.name}` : null;

    const reciboUrl = reciboFile ? await uploadFileToStorage(reciboFile, reciboPath) : null;
    const transaccionUrl = transaccionFile ? await uploadFileToStorage(transaccionFile, transaccionPath) : null;

    const newDisinfection = {
        fecha: Timestamp.fromDate(new Date(disinfectionData.fechaDesinfeccion + "T00:00:00")),
        recibo: disinfectionData.numeroReciboPago,
        urlRecibo: reciboUrl,
        nombreArchivoRecibo: reciboFile ? reciboFile.name : null,
        transaccion: disinfectionData.numeroTransaccionPago,
        urlTransaccion: transaccionUrl,
        nombreArchivoTransaccion: transaccionFile ? transaccionFile.name : null,
        montoPagado: parseFloat(disinfectionData.montoPagado) || 0,
        observaciones: disinfectionData.observaciones || '',
        registradoPor: currentUserUid,
        fechaRegistro: Timestamp.now()
    };
    const diasVigencia = DIAS_VIGENCIA_TIPO[vehicle.tipoVehiculo] || 30;
    const fechaVencimiento = new Date(newDateObj.getTime() + diasVigencia * 24 * 60 * 60 * 1000);
    const fechaVencimientoTs = Timestamp.fromDate(fechaVencimiento);
    const updatedHistorial = [newDisinfection, ...(vehicle.historialDesinfecciones || [])].sort((a,b) => b.fecha.toMillis() - a.fecha.toMillis());

    await updateDoc(vehicleRef, {
        ultimaFechaDesinfeccion: newDisinfection.fecha,
        ultimoReciboPago: newDisinfection.recibo,
        ultimaUrlRecibo: newDisinfection.urlRecibo,
        ultimaTransaccionPago: newDisinfection.transaccion,
        ultimaUrlTransaccion: newDisinfection.urlTransaccion,
        ultimoMontoPagado: newDisinfection.montoPagado,
        ultimasObservaciones: newDisinfection.observaciones,
        historialDesinfecciones: updatedHistorial,
        fechaVencimiento: fechaVencimientoTs
    });

    // Return the new state for the selected vehicle
    return { ...vehicle, ...newDisinfection, historialDesinfecciones: updatedHistorial, id: vehicleId };
};

export const handleDeleteVehicle = async (vehiclesCollectionPath, vehicleId) => {
    await deleteDoc(doc(db, vehiclesCollectionPath, vehicleId));
};

export const handleUpdateDisinfection = async (vehiclesCollectionPath, vehicleId, fechaRegistroMillis, updatedFields) => {
    const vehicleRef = doc(db, vehiclesCollectionPath, vehicleId);
    const snap = await getDoc(vehicleRef);
    if (!snap.exists()) throw new Error('Vehículo no encontrado.');
    const vehicle = snap.data();
    const historial = vehicle.historialDesinfecciones || [];
    const index = historial.findIndex(d => d.fechaRegistro && d.fechaRegistro.toMillis && d.fechaRegistro.toMillis() === fechaRegistroMillis);
    if (index === -1) throw new Error('Registro no encontrado.');

    // Validate no duplicate month when changing the date
    if (updatedFields.fecha) {
        const newDate = updatedFields.fecha.toDate ? updatedFields.fecha.toDate() : new Date(updatedFields.fecha);
        const month = newDate.getMonth();
        const year = newDate.getFullYear();
        const conflict = historial.some((d, i) => {
            if (i === index) return false; // skip current record
            const existing = d.fecha.toDate ? d.fecha.toDate() : new Date(d.fecha);
            return existing.getFullYear() === year && existing.getMonth() === month;
        });
        if (conflict) {
            throw new Error('Ya existe una desinfección registrada para este mes.');
        }
    }
    historial[index] = { ...historial[index], ...updatedFields };
    const sorted = [...historial].sort((a,b) => b.fecha.toMillis() - a.fecha.toMillis());
    const ultima = sorted[0] || {};
    const diasVigencia = DIAS_VIGENCIA_TIPO[vehicle.tipoVehiculo] || 30;
    const ultimaFecha = ultima.fecha ? (ultima.fecha.toDate ? ultima.fecha.toDate() : new Date(ultima.fecha)) : null;
    const fechaVencimientoTs = ultimaFecha ? Timestamp.fromDate(new Date(ultimaFecha.getTime() + diasVigencia * 24 * 60 * 60 * 1000)) : null;
    await updateDoc(vehicleRef, {
        historialDesinfecciones: sorted,
        ultimaFechaDesinfeccion: ultima.fecha || null,
        ultimoReciboPago: ultima.recibo || null,
        ultimaUrlRecibo: ultima.urlRecibo || null,
        ultimaTransaccionPago: ultima.transaccion || null,
        ultimaUrlTransaccion: ultima.urlTransaccion || null,
        ultimoMontoPagado: ultima.montoPagado || null,
        ultimasObservaciones: ultima.observaciones || null,
        fechaVencimiento: fechaVencimientoTs
    });
    const updatedSnap = await getDoc(vehicleRef);
    return { id: updatedSnap.id, ...updatedSnap.data() };
};

export const handleDeleteDisinfection = async (vehiclesCollectionPath, vehicleId, fechaRegistroMillis) => {
    const vehicleRef = doc(db, vehiclesCollectionPath, vehicleId);
    const snap = await getDoc(vehicleRef);
    if (!snap.exists()) throw new Error('Vehículo no encontrado.');
    const vehicle = snap.data();
    const historial = vehicle.historialDesinfecciones || [];
    const index = historial.findIndex(d => d.fechaRegistro && d.fechaRegistro.toMillis && d.fechaRegistro.toMillis() === fechaRegistroMillis);
    if (index === -1) throw new Error('Registro no encontrado.');
    historial.splice(index,1);
    const sorted = [...historial].sort((a,b) => b.fecha.toMillis() - a.fecha.toMillis());
    const ultima = sorted[0] || {};
    const diasVigencia = DIAS_VIGENCIA_TIPO[vehicle.tipoVehiculo] || 30;
    const ultimaFecha = ultima.fecha ? (ultima.fecha.toDate ? ultima.fecha.toDate() : new Date(ultima.fecha)) : null;
    const fechaVencimientoTs = ultimaFecha ? Timestamp.fromDate(new Date(ultimaFecha.getTime() + diasVigencia * 24 * 60 * 60 * 1000)) : null;
    await updateDoc(vehicleRef, {
        historialDesinfecciones: sorted,
        ultimaFechaDesinfeccion: ultima.fecha || null,
        ultimoReciboPago: ultima.recibo || null,
        ultimaUrlRecibo: ultima.urlRecibo || null,
        ultimaTransaccionPago: ultima.transaccion || null,
        ultimaUrlTransaccion: ultima.urlTransaccion || null,
        ultimoMontoPagado: ultima.montoPagado || null,
        ultimasObservaciones: ultima.observaciones || null,
        fechaVencimiento: fechaVencimientoTs
    });
    const updatedSnap = await getDoc(vehicleRef);
    return { id: updatedSnap.id, ...updatedSnap.data() };
};

export const addUser = async (usersCollectionPath, username, password, role = 'admin') => {
    const q = query(collection(db, usersCollectionPath), where('username', '==', username));
    const existing = await getDocs(q);
    if (!existing.empty) {
        throw new Error('Usuario ya existe.');
    }
    const ref = doc(collection(db, usersCollectionPath));
    await setDoc(ref, { username, password, role });
    return { id: ref.id, username, role };
};

export const fetchUsers = (usersCollectionPath, callback) => {
    const q = query(collection(db, usersCollectionPath));
    return onSnapshot(q, (snap) => {
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        callback({ data });
    }, (error) => {
        console.error('User Fetch Error: ', error);
        callback({ error: 'Error al cargar usuarios.' });
    });
};

export const addLogEntry = async (logsCollectionPath, userId, action, details) => {
    const ref = collection(db, logsCollectionPath);
    await addDoc(ref, {
        userId,
        action,
        details,
        timestamp: Timestamp.now()
    });
};

export const fetchLogs = (logsCollectionPath, callback) => {
    const q = query(collection(db, logsCollectionPath), orderBy('timestamp', 'desc'));
    return onSnapshot(q, (snap) => {
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        callback({ data });
    }, (error) => {
        console.error('Logs Fetch Error: ', error);
        callback({ error: 'Error al cargar logs.' });
    });
};

