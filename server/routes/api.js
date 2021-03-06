var Usuario 	  = require('../models/usuario');
var Chat          = require('../models/chat');
var mongoose 	  = require('mongoose');
var nodemailer    = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');

var conta = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: 'muriloeduardoooooo@gmail.com',
        pass: 'liloeduardo0202'
    }
});

module.exports = function(router, passport) {
	
		//////////////////////////////////////////////////
	   //////////////////// AUTH ////////////////////////
	  //////////////////////////////////////////////////
	
	// Middleware de Autenticação
	router.use(function(req, res, next){
		if(req.isAuthenticated()){
			return next();
		}
		res.redirect('/login');
	});

		///////////////////////////////////////////////
	   ////////////// USUARIO ///////////////////////
	  ////////////////////////////////////////////
	
	// PEGA DADOS DE UM UNICO USUARIO
	router.get('/user/:id', function(req, res){
		Usuario.findOne({_id: req.params.id}, function(err, data){
			res.json(data);
		});
	});
	
	// PEGA TODOS OS USUARIOS DE TAL APLICAÇÃO
	router.get('/users/:app_id', function(req, res){
		Usuario.find({bubbles: req.params.app_id}, function(err, users){
			res.json(users);
		});
	});

	// CRIAR NOVO ADMINISTRADOR //
	router.post('/user', function(req, res){
		Usuario.findOne({'local.email': req.body.email}, function(err, user){
			if(!user){
				var novoAdm = new Usuario();
				novoAdm.local.email = req.body.email;
				novoAdm.bubbles.push(req.body.app_id);

				novoAdm.save(function(err, data1){
					if(err){
						throw err;
					}else{
						Chat.findOne({_id: req.body.app_id}, function(err, chat){
							chat.administradores.push(data1._id);
							chat.save(function(err, data3){
								if(err){
									throw err;
								}else{

									conta.sendMail({
										from: 'Bubble Talk <muriloeduardoooooo@gmail.com>',
										to: req.body.email,
										subject: 'Parabéns! Você foi convidado para se tornar um membro de equipe',
										html: `
											<table width="600px" cellspacing="0" cellpadding="30" border="0" style="margin:auto;">
												<tr>
													<td width="100%" height="300px" bgcolor="#00f2d4" valign="top" style="color:#fff;">
														<h2 style="font-size:2em;font-family: Open Sans,Lucida Grande,Segoe UI,Arial,Verdana,Lucida Sans Unicode,Tahoma,Sans Serif;">
															Convite para voc&ecirc; se tornar um membro da equipe ` + chat.dados.appname + `
														</h2>
														<p style="text-align:center;margin-top:80px;">
															<a href="http://127.0.0.1:10/confirmacao/` + data1._id + `" style="text-decoration:none;padding:15px 30px;border-radius:30px;background-color:#fff;color:#00f2d4;text-align:center;cursor:pointer;font-size:22px;font-family: Open Sans,Lucida Grande,Segoe UI,Arial,Verdana,Lucida Sans Unicode,Tahoma,Sans Serif;">
																<b>Cadastrar sua nova senha</b
															</a>
														</p>
													</td>
												</tr>
												<tr>
													<td width="100%" height="200px" bgcolor="#fbfbfb" valign="top">
														<h1 style="color:#555;font-family: Open Sans,Lucida Grande,Segoe UI,Arial,Verdana,Lucida Sans Unicode,Tahoma,Sans Serif;">
															Por que estou recebendo este email?
														</h1>
														<p style="color:#555;font-family: Open Sans,Lucida Grande,Segoe UI,Arial,Verdana,Lucida Sans Unicode,Tahoma,Sans Serif;">
															Algum administrador lhe enviou um convite para se tornar um membro da equipe do chat` + chat.dados.appname + `.
														</p>
														<p style="text-align:center;margin:60px 0 20px 0;">
															<a href="#" style="text-decoration:none;padding:15px;border-radius:30px;background-color:#00f2d4;color:#fff;text-align:center;cursor:pointer;font-family: Open Sans,Lucida Grande,Segoe UI,Arial,Verdana,Lucida Sans Unicode,Tahoma,Sans Serif;">
																<b>D&uacute;vidas? Clique aqui</b>
															</a>
														</p>
													</td>
												</tr>
												<tr>
													<td width="100%" bgcolor="#f1f1f1" valign="top">
														<p style="text-align:center;color:#555;font-family: Open Sans,Lucida Grande,Segoe UI,Arial,Verdana,Lucida Sans Unicode,Tahoma,Sans Serif;">
															Fique tranquilo, tamb&eacute;m odiamos spam :)
														</p>
													</td>
												</tr>
											</table>
										`
									}, function(err){
										if(err)
											throw err;
									});

									res.json(data1);
								}
							});
						});
					}
				});
			}else{
				res.json({existe: true});
			}
		});
	});

	// EDITAR UM USUARIO //
	router.put('/user/:id', function(req, res){
		Usuario.findOne({_id: req.params.id}, function(err, data){

			var usuario         = data;
			usuario.nome        = req.body.nome;
			usuario.local.email = req.body.local.email;
			
			if(req.body.local.senha)
				usuario.local.senha = usuario.generateHash(req.body.local.senha);

			usuario.save(function(err, data){
				if(err){
					throw err;
				}else{
					res.json(data);
				}
			});
		});
	});
	

		/////////////////////////////////////////////
	   //////////// CHAT //////////////////////////
	  ///////////////////////////////////////////

	// CRIAR UM NOVO CHAT //
	router.post('/chat', function(req, res){
		Chat.findOne({'dados.appname': req.body.dados.appname}, function(err, data){
			// Appname nao encontrado, entao nao existe
			// Deverá e será unico
			if(!data){
				var novoChat     = new Chat();
				novoChat.dados   = req.body.dados;
				novoChat.criador = req.user._id;
				
				novoChat.administradores.push(req.user._id);

				novoChat.save(function(err, data){
					if(err){
						throw err;
					}else{

						var propriedadeUsuario = req.user;
						propriedadeUsuario.bubbles.push(data._id);

						propriedadeUsuario.save(function(err){
							if(err){
								throw err;
							}else{
								res.json(data);
							}
						});
					}
				});
			}else{
				// Appname encontrado
				res.json({err: true});
			}
		});
	});

	// EDITAR UM BUBBLE //
	router.put('/chat/:id', function(req, res){
		Chat.findOne({_id: req.params.id}, function(err, data){
			
			var chat               = data;
			chat.dados.nome 	   = req.body.dados.nome;
			chat.dados.ramo        = req.body.dados.ramo;
			chat.dados.idCriador   = req.body.dados.idCriador;
			chat.dados.dtCadastro  = new Date();

			chat.save(function(err, data){
				if(err){
					throw err;
				}else{
					res.json(data);
				}
			});
		});
	});

	//EXCLUIR UM BUBBLE //
	router.delete('/chat/:id', function(req, res){
		Chat.remove({_id: req.params.id}, function(err){
			res.json({result: err?0:1});
		});
	});

	// LISTAR TODAS OS BUBBLES DO USUARIO LOGADO //
	router.get('/chat', function(req, res){
		Chat.find({_id: { $in: req.user.bubbles.map(function(o){ return mongoose.Types.ObjectId(o); })}}, function(err, data){
			res.json(data);
		});
	});

	// LISTAR UM BUBBLE //
	router.get('/chat/:app_id', function(req, res){
		Chat.findOne({'_id': req.params.app_id}, function(err, data1){
			if(!data1) {
				res.json({err:-1});
			} else {
				Usuario.find({_id: { $in: data1.administradores.map(function(o){ return mongoose.Types.ObjectId(o); })}}, function(err, data2){
					data1.administradores = data2;
					res.json(data1);
				});
			}
		});
	});
};