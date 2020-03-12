const express = require('express')
const mysql = require('mysql')
const bodyParser = require('body-parser')
const jwt = require('jsonwebtoken')
const session = require('express-session')

const port = 5000;

const secretKey = 'thisisverysecretkey';

const app = express();

app.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

const db = mysql.createConnection({
    host: '127.0.0.1',
    port: '3306',
    user: ' root',
    password: '',
    database: "ukl_imel"
});

const isAuthorized = (request, result, next) => {
    // cek apakah user sudah mengirim header 'x-api-key'
    if (typeof(request.headers['x-api-key']) == 'undefined') {
        return result.status(403).json({
            success: false,
            message: 'Unauthorized. Token is not provided'
        })
    }

    // get token dari header
    let token = request.headers['x-api-key']

    // melakukan verifikasi token yang dikirim user
    jwt.verify(token, secretKey, (err, decoded) => {
        if (err) {
            return result.status(401).json({
                success: false,
                message: 'Unauthorized. Token is invalid'
            })
        }
    })

    // lanjut ke next request
    next()
}

//mencocokkan username dan password yang ada di database sebagai penyewa
app.post('/login/penyewa', function(request, response) {
    let data = request.body
	var username = data.username;
	var password = data.password;
	if (username && password) {
		db.query('SELECT * FROM penyewa WHERE username= ? AND password = ?', [username, password], function(error, results, fields) {
			if (results.length > 0) {
				request.session.loggedin = true;
				request.session.username = data.username;
				response.redirect('/login/penyewa');
			} else {
				response.send('Username dan/atau Password salah!');
			}			
			response.end();
		});
	} else {
		response.send('Masukkan Username and Password!');
		response.end();
	}
});


app.get('/login/penyewa', function(request, results) {
	if (request.session.loggedin) {
        let data = request.body
        let token = jwt.sign(data.username + '|' + data.password, secretKey)

        results.json({
            success: true,
            message: 'Login success, welcome back!',
            token: token
        })
	} else {
        results.json({
            success: false,
            message:'Mohon login terlebih dahulu!'
        })
        }
	
	results.end();
});

//mencocokkan username dan password yang ada di database
app.post('/login/user', function(request, response) {
	var email = request.body.email;
	var password = request.body.password;
	if (email && password) {
		db.query('SELECT * FROM user WHERE email = ? AND password = ?', [email, password], function(error, results, fields) {
			if (results.length > 0) {
				request.session.loggedin = true;
				request.session.email = email;
				response.redirect('/home');
			} else {
				response.send('Email dan/atau Password salah!');
			}			
			response.end();
		});
	} else {
		response.send('Masukkan Email and Password!');
		response.end();
	}
});


app.get('/home', function(request, response) {
	if (request.session.loggedin) {
		response.send('Selamat Datang, ' + request.session.email + '!');
	} else {
		response.send('Mohon login terlebih dahulu!');
	}
	response.end();
});

/***** CRUD User ******/

app.get('/user', isAuthorized, (req, res) => {
    let sql = `
        select nama, alamat, kontak, email, password from user
    `

    db.query(sql, (err, result) => {
        if (err) throw err

        res.json({
            message: "Sukses mendapatkan semua data",
            data: result
        })
    })
})

app.post('/register/user',isAuthorized, (req, res) => {
    let data = req.body

    let sql = `insert into user (nama, alamat, kontak, email, password)
    values ('`+data.nama+`', '`+data.alamat+`', '`+data.kontak+`', '`+data.email+`', '`+data.password+`')
`

db.query(sql, (err, result) => {
    if (err) throw err

    res.json({
        message: "Data berhasil dibuat",
        data: result
    })
})
})


app.get('/user/:id_user', isAuthorized,(req, res) => {
let sql = `
    select * from user
    where id_user = `+req.params.id_user+`
    limit 1
`

db.query(sql, (err, result) => {
    if (err) throw err

    res.json({
        message: "Sukses mendapatkan data detail",
        data: result[0]
    })
})
})

app.put('/user/:id_user', isAuthorized,(req, res) => {
let data = req.body

let sql = `
    update user
    set nama = '`+data.nama+`', alamat = '`+data.alamat+`', kontak = '`+data.kontak+`', email = '`+data.email+`', password = '`+data.password+`'
    where id_user = '`+req.params.id_user+`'
`
db.query(sql, (err, result) => {
    if (err) throw err

    res.json({
        message: "Data berhasil diedit",
        data: result
    })
})
})

app.delete('/user/:id_user', isAuthorized,(req, res) => {
let sql = `
    delete from user
    where id_user = '`+req.params.id_user+`'
`

db.query(sql, (err, result) => {
    if (err) throw err
    
    res.json({
        message: "data berhasil dihapus",
        data: result
    })
})
})

/***** CRUD Mobil ******/

app.get('/mobil', isAuthorized, (req, res) => {
    let sql = `
        select merk_mobil, warna_mobil, tersedia_mobil, harga_sewamobil from mobil
    `

    db.query(sql, (err, result) => {
        if (err) throw err

        res.json({
            message: "sukses mendapatkan data mobil",
            data: result
        })
    })
})

app.post('/mobil',isAuthorized, (req, res) => {
    let data = req.body

    let sql = `
        insert into  (merk_mobil, warna_mobil, tersedia_mobil, harga_sewamobil)
        values (''`+data.merk_mobil+`', '`+data.warna_mobil+`', '`+data.tersedia_mobil+`', '`+data.harga_sewamobil`')
    `
    db.query(sql, (err, result) => {
        if (err) throw err

        res.json({
            message: "Data berhasil dibuat",
            data: result
        })
    })
})

app.get('/mobil/:id_mobil', isAuthorized, (req, res) => {
    let sql = `
        select * from mobil
        where id_mobil = `+req.params.id_mobil+`
        limit 1
    `

    db.query(sql, (err, result) => {
        if (err) throw err

        res.json({
            message: "Sukses mendapatkan data detail",
            data: result[0]
        })
    })
})

app.put('/mobil/:id_mobil', isAuthorized, (req, res) => {
    let data = req.body

    let sql = `
        update mobil
        set merk_mobil = '`+data.merk_mobil+`', warna_mobil = '`+data.warna_mobil+`', tersedia_mobil = '`+data.tersedia_mobil+`', harga_sewamobil = '`+data.harga_sewamobil+`'
        where id_mobil = '`+req.params.id_mobil+`'
    `

    db.query(sql, (err, result) => {
        if (err) throw err

        res.json({
            message: "Data berhasil diedit",
            data: result
        })
    })
})

app.delete('/mobil/:id_mobil', isAuthorized,(req, res) => {
    let sql = `
        delete from mobil
        where id_mobil = '`+req.params.id_mobil+`'
    `

    db.query(sql, (err, result) => {
        if (err) throw err
        
        res.json({
            message: "Data berhasil dihapus",
            data: result
        })
    })
})

/***** CRUD Motor ******/

app.get('/motor', isAuthorized, (req, res) => {
    let sql = `
        select merk_motor, warna_motor, tersedia_motor, harga_sewamotor from motor
    `

    db.query(sql, (err, result) => {
        if (err) throw err

        res.json({
            message: "sukses mendapatkan data motor",
            data: result
        })
    })
})

app.post('/motor',isAuthorized, (req, res) => {
    let data = req.body

    let sql = `
        insert into  (merk_motor, warna_motor, tersedia_motor, harga_sewamotor)
        values (''`+data.merk_motor+`', '`+data.warna_motor+`', '`+data.tersedia_motor+`', '`+data.harga_sewamotor`')
    `
    db.query(sql, (err, result) => {
        if (err) throw err

        res.json({
            message: "Data berhasil dibuat",
            data: result
        })
    })
})

app.get('/motor/:id_motor', isAuthorized, (req, res) => {
    let sql = `
        select * from motor
        where id_motor = `+req.params.id_motor+`
        limit 1
    `

    db.query(sql, (err, result) => {
        if (err) throw err

        res.json({
            message: "Sukses mendapatkan data detail",
            data: result[0]
        })
    })
})

app.put('/motor/:id_motor', isAuthorized, (req, res) => {
    let data = req.body

    let sql = `
        update motor
        set merk_motor = '`+data.merk_motor+`', warna_motor = '`+data.warna_motor+`', tersedia_motor = '`+data.tersedia_motor+`', harga_sewamotor = '`+data.harga_sewamotor+`'
        where id_motor = '`+req.params.id_motor+`'
    `

    db.query(sql, (err, result) => {
        if (err) throw err

        res.json({
            message: "Data berhasil diedit",
            data: result
        })
    })
})

app.delete('/motor/:id_motor', isAuthorized,(req, res) => {
    let sql = `
        delete from motor
        where id_motor = '`+req.params.id_motor+`'
    `

    db.query(sql, (err, result) => {
        if (err) throw err
        
        res.json({
            message: "Data berhasil dihapus",
            data: result
        })
    })
})

/********** Transaksi  **********/

app.post('/mobil/:id/sewa', isAuthorized,(req, res) => {
    let data = req.body
    
    db.query(`
        insert into transaksi (id_user, id_mobil, banyak_sewa, total)
        values ('`+data.id_user+`', '`+req.params.id_mobil+`', '`+req.params.banyak_sewa+`', '`+req.params.total`')
    `, (err, result) => {
        if (err) throw err
    })
    
    db.query(`
        update mobil
        set tersedia_mobil = tersedia_mobil - 1
        where id_mobil = '`+req.params.id_mobil+`'
        `, (err, result) => {
            if (err) throw err
        })
    
        res.json({
            message: "SUKSES!!"
        })
    })

app.post('/motor/:id/sewa', isAuthorized,(req, res) => {
    let data = req.body
        
    db.query(`
        insert into transaksi (id_user, id_motor, banyak_sewa, total)
        values ('`+data.id_user+`', '`+req.params.id_motor+`', '`+req.params.banyak_sewa+`', '`+req.params.total`')
    `, (err, result) => {
        if (err) throw err
    })
        
    db.query(`
        update motor
        set tersedia_motor = tersedia_motor - 1
        where id_motor = '`+req.params.id_motor+`'
        `, (err, result) => {
            if (err) throw err
        })
        
        res.json({
             message: "SUKSES!!"
        })
    })
    
    /********** Run Application **********/
    app.listen(port, () => {
        console.log('App running on port ' + port)
    })
    