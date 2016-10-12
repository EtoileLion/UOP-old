#This class will simulate a standard playing deck of 52 cards.
from random import shuffle
class Deck:
	deckvals = {"Ace":1,"2":2,"3":3,"4":4,"5":5,"6":6,"7":7,"8":8,"9":9,"10":10,"Jack":10,"Queen":10,"King":10}

	def __init__(self):
		self.deck = [Card(j,i,self.deckvals[j]) for j in ["Ace","2","3","4","5","6","7","8","9","10","Jack","Queen","King"] for i in ['Hearts','Diamonds','Clubs','Spades']]	
		
	def draw(self,num,hidden=False):
		if(type(num) != int):
			raise TypeError("Must deal an integer number.")
		if(num < 0):
			raise ValueError("Must deal at least zero cards.")
		if(num > len(self.deck)):
			raise ValueError("There are not that many cards left in the deck.")
		ret = []
		for i in range(num):
			card = self.deck.pop()
			if(hidden):
				print("Dealt a card face down.")
			else:
				print("Dealt the "+str(card.name)+" of "+str(card.suit))	
			ret.append(card)
		return ret

	def reshuffle(self):
		#Eventually this will need to clean up the objects it created before, but for now, naivity.
		self.deck = [Card(j,i,self.deckvals[j]) for j in ["Ace","2","3","4","5","6","7","8","9","10","Jack","Queen","King"] for i in ['Hearts','Diamonds','Clubs','Spades']]	
		self.shuffle()
		
	def shuffle(self):
		shuffle(self.deck)
	
class Card:
	def __init__(self,name,suit,value):
		if(not isinstance(name,(str,bytes))):
			raise TypeError("Name must be a String.")
		if(not isinstance(suit,(str,bytes))):
			raise TypeError("Suit must be a String.")
		if(not isinstance(value,(int,float,complex))):
			raise TypeError("Value must be numeric.")			
		self.name = name
		self.suit = suit
		self.value = value

##### UNIT TESTING #####
import unittest
import nose.tools
class TestDeck(unittest.TestCase):
	def test_deck_creation(self):
		adeck = Deck()
		self.assertEquals(Deck,type(adeck))
		self.assertEquals(52,len(adeck.deck))
		self.assertEquals(52,len(dict((str(card.name)+card.suit, card) for card in adeck.deck).values()))
		#God that's ugly.
		
	def test_deck_shuffle(self):
		adeck = Deck()
		#Shuffle is in-place, so the previous version wont work.
		temp = adeck.deck.copy()
		adeck.shuffle()
		self.assertNotEquals(temp,adeck.deck)
		#There is an microscopic chance of this failing, because a shuffled deck has a 1/(52!) chance of being the same twice.
	
	def test_deck_draw_good(self):
		adeck = Deck()
		cards = adeck.draw(5)
		self.assertEquals(5,len(cards))
		self.assertEquals(Card,type(cards[0]))
	
	def test_deck_draw_bad_type(self):
		adeck = Deck()
		with self.assertRaises(TypeError):
			adeck.draw("Quack")
	
	def test_deck_draw_bad_number(self):
		adeck = Deck()
		with self.assertRaises(ValueError):
			adeck.draw(-1)
	
	def test_deck_draw_too_many(self):
		adeck = Deck()
		with self.assertRaises(ValueError):
			adeck.draw(53)
	
	def test_deck_reshuffle(self):
		adeck = Deck()
		adeck.draw(15)
		adeck.reshuffle()
		self.assertEquals(52,len(adeck.deck))

	def test_card_creation(self):
		self.assertEquals(Card,type(Card("Vort","San",1)))
	
	def test_card_bad_value(self):
		with self.assertRaises(TypeError):
			Card("Vort","San","Val")
	
	def test_card_bad_name(self):
		with self.assertRaises(TypeError):
			Card(1,"Heads",1)
	
	def test_card_bad_suit(self):
		with self.assertRaises(TypeError):
			Card("One",{},1)
		#Something that's not a string.
	